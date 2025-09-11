// orchestration/assignmentWorker.ts
import { Order } from "../types/order.types";
import { LogisticOrder } from "../model/LogisticOrders";
import { createDynamicTourAsync } from "../services/dynamicTour.service";
import { createDeliveryCostForTour } from "../services/tour.service";

import { Warehouse } from "../types/warehouse.types";
import {
  getActiveWarehousesWithVehicles,
  getWarehouseZipcodesRecord,
} from "../services/warehouse.service";

import { haversineKm } from "../utils/haversine";
import * as helper from "../helpers/assignmentWorker.helper";
import { DynamicTourPayload } from "../types/dto.types";
import { getWarehouseToOrdersMetrix } from "../helpers/tour.helper";

const MIN_ORDERS = 5;
const CLOSE_DISTANCE_OVERRIDE_KM = 10;
const TIME_WINDOW_HOURS = 9;

export async function processBatch() {
  // Fetch new orders
  const orders: Order[] = await LogisticOrder.getPendingOrdersAsync();
  if (!orders.length) return;

  // Fetch active warehouses and zip mappings
  const warehouses: Warehouse[] = await getActiveWarehousesWithVehicles();
  const warehouse_zipMap = await getWarehouseZipcodesRecord(
    warehouses.map((w) => w.id)
  ); // Record<warehouseId, Set<zipcode>>

  const assignments = new Map<number, Order[]>();
  let accepted_Maps = new Map<number, Order[][]>(); // warehouseId -> clusters
  let trimmed_Maps = new Map<number, Order[]>();

  // ASSIGN orders to warehouses
  for (const order of orders) {
    let best: (typeof warehouses)[0] | null = null;
    let bestDist = Infinity;

    for (const wh of warehouses) {
      const d = haversineKm(
        wh.lat!,
        wh.lng!,
        order.location.lat!,
        order.location.lng!
      );
      if (d < bestDist) {
        bestDist = d;
        best = wh;
      }
    }

    const zipcodeOwner = warehouses.find((w) =>
      warehouse_zipMap?.[w.id].zip_codes_delivering.includes(
        Number(order.zipcode)
      )
    );

    const chosenWarehouses: (typeof warehouses)[0][] = [];
    if (zipcodeOwner) {
      if (
        best!.id !== zipcodeOwner.id &&
        bestDist + 0.1 <=
          haversineKm(
            zipcodeOwner.lat!,
            zipcodeOwner.lng!,
            order.location.lat!,
            order.location.lng!
          ) -
            CLOSE_DISTANCE_OVERRIDE_KM
      ) {
        chosenWarehouses.push(best!);
      } else {
        chosenWarehouses.push(zipcodeOwner);
      }
    } else {
      chosenWarehouses.push(best!);
    }

    for (const wh of chosenWarehouses) {
      if (!assignments.has(wh.id)) assignments.set(wh.id, []);
      assignments.get(wh.id)!.push(order);
    }
  }

  // -- Process clusters per warehouse --
  for (const [warehouseId, candidateOrders] of assignments.entries()) {
    if (candidateOrders.length < MIN_ORDERS) continue;

    const warehouse = warehouses.find((w) => w.id === warehouseId)!;
    if (!warehouse) continue;

    const { ACCEPTED_CLUSTERS, TRIMMED_ORDERS } =
      await processWarehouseClusters(warehouse, [candidateOrders]);

    if (ACCEPTED_CLUSTERS.size) {
      accepted_Maps.set(warehouseId, ACCEPTED_CLUSTERS.get(warehouseId)!);
    }

    if (TRIMMED_ORDERS.size) {
      trimmed_Maps = new Map([...trimmed_Maps, ...TRIMMED_ORDERS]);
    }
  }

  // Retry trimmed orders once
  if (trimmed_Maps.size) {
    for (const [warehouseId, trimmedList] of trimmed_Maps.entries()) {
      const warehouse = warehouses.find((w) => w.id === warehouseId)!;
      if (!warehouse) continue;

      const { ACCEPTED_CLUSTERS: accept2 } = await processWarehouseClusters(
        warehouse,
        [trimmedList]
      );

      if (accept2.size) {
        const prev = accepted_Maps.get(warehouseId) ?? [];
        accepted_Maps.set(warehouseId, prev.concat(accept2.get(warehouseId)!));
      }
      // leave trimmed2 for next batch
    }
  }

  for (const [warehouseId, clusters] of accepted_Maps.entries()) {
    for (const cluster of clusters) {
      const tourPayload: DynamicTourPayload = {
        warehouse_id: warehouseId,
        orderIds: cluster.map((o) => o.order_id).join(","),
        totalOrdersItemsQty: 0,
      };
      const dTour_res = await createDynamicTourAsync(tourPayload);
      await createDeliveryCostForTour(dTour_res?.dynamicTour?.id!);
    }
  }
}

export async function processWarehouseClusters(
  warehouse: Warehouse,
  jaggedOrders: Order[][]
) {
  const TRIMMED_ORDERS = new Map<number, Order[]>();
  const ACCEPTED_CLUSTERS = new Map<number, Order[][]>();

  for (const candidateOrders of jaggedOrders) {
    if (candidateOrders.length < MIN_ORDERS) continue;

    const clusters = helper.clusterOrders(candidateOrders, warehouse);

    for (let cluster of clusters) {
      if (cluster.length < MIN_ORDERS) {
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
        continue;
      }

      // quick approximate check
      let approxSec = helper.secondsForApproxRoute(warehouse, cluster);
      if (approxSec > TIME_WINDOW_HOURS * 3600) {
        const { fitted, trimmed } = helper.trimClusterToFit(warehouse, cluster);
        if (trimmed.length) {
          const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
          TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmed));
        }
        cluster = fitted;
      }

      if (!cluster.length || cluster.length < MIN_ORDERS) continue;

      try {
        const { tourDurationSec } = await getWarehouseToOrdersMetrix(
          warehouse,
          cluster
        );

        if (
          (tourDurationSec == null && approxSec <= TIME_WINDOW_HOURS * 3600) ||
          (tourDurationSec != null &&
            tourDurationSec <= TIME_WINDOW_HOURS * 3600)
        ) {
          const prev = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
          ACCEPTED_CLUSTERS.set(warehouse.id, [...prev, cluster]);
        } else {
          let fitted = [...cluster];
          const trimmedLocal: Order[] = [];
          while (fitted.length >= MIN_ORDERS) {
            const toRemove = fitted.pop()!;
            trimmedLocal.push(toRemove);

            const { tourDurationSec: dur2 } = await getWarehouseToOrdersMetrix(
              warehouse,
              fitted
            );

            if (dur2 != null && dur2 <= TIME_WINDOW_HOURS * 3600) {
              const prev = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
              ACCEPTED_CLUSTERS.set(warehouse.id, [...prev, fitted]);
              break;
            }
          }

          if (trimmedLocal.length) {
            const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
            TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmedLocal));
          }
        }
      } catch (err) {
        console.error("getWarehouseToOrdersMetrix failed", err);
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
      }
    }
  }

  return { ACCEPTED_CLUSTERS, TRIMMED_ORDERS };
}
