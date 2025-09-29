import pLimit from "p-limit";

import { createDynamicTourAsync } from "../services/dynamicTour.service";
// import { createDeliveryCostForTour } from "../services/tour.service";
import {
  getActiveWarehousesWithVehicles,
  getWarehouseLocationCords,
  getWarehouseZipcodesRecord,
} from "../services/warehouse.service";

import { haversineKm } from "../utils/haversine";
import { logWithTime } from "../utils/logging";

import * as helper from "../helpers/assignmentWorker.helper";
// import { getWarehouseToOrdersMetrix } from "../helpers/tour.helper";

import { LogisticOrder } from "../model/LogisticOrders";
import { Order } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { DynamicTourPayload } from "../types/dto.types";

const MIN_ORDERS = 3;
const CLOSE_DISTANCE_OVERRIDE_KM = 10;
const TIME_WINDOW_HOURS = 9;

export async function processBatch() {
  // Fetch new orders
  const orders: Order[] = await LogisticOrder.getPendingOrdersAsync();
  if (!orders.length) return;

  //   console.log(`Fetched ${orders.length} pending DB orders:`, orders);

  // Fetch active warehouses and zip mappings
  const warehouses: Warehouse[] = await getActiveWarehousesWithVehicles();
  //   console.log("Active Warehouses:", warehouses);
  if (!warehouses.length) {
    logWithTime("No active warehouses with vehicles found.");
    return;
  }

  for (const wh of warehouses) {
    if (!wh.lat || !wh.lng) {
      const location = await getWarehouseLocationCords(wh);
      if (location) {
        wh.lat = location.lat;
        wh.lng = location.lng;
      } else {
        continue;
      }
    }
  }

  for (const order of orders) {
    if (!order.location.lat || !order.location.lng) {
      const location = await LogisticOrder.getOrderLocationCords(order);
      if (location) {
        order.location.lat = location.lat;
        order.location.lng = location.lng;
      } else {
        continue;
      }
    }
  }

  const warehouse_zipMap = await getWarehouseZipcodesRecord(
    warehouses.map((w) => w.id)
  ); // Record<warehouseId, Set<zipcode>>

  const assignments = new Map<number, Order[]>();
  let accepted_Maps = new Map<number, Order[][]>(); // warehouseId -> clusters
  // let accepted_Maps = new Map<
  //   number,
  //   { cluster: Order[]; approxHrs: number }[]
  // >();

  let trimmed_Maps = new Map<number, Order[]>();

  // ASSIGN orders to warehouses
  console.log("ASSIGNING orders to warehouses");
  for (const order of orders) {
    let best: (typeof warehouses)[0] | null = null;
    let bestDist = Infinity;

    for (const wh of warehouses) {
      const d = haversineKm(
        wh.lat,
        wh.lng,
        order.location.lat,
        order.location.lng
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

    if (chosenWarehouses !== null) {
      for (const wh of chosenWarehouses) {
        console.log(
          `chosen warehouse for order ${order.order_id}: ${wh.id}-${wh.town}`
        );
        if (!assignments.has(wh.id)) assignments.set(wh.id, []);
        assignments.get(wh.id)!.push(order);
      }
    }
  }

  // -- Process clusters per warehouse --
  logWithTime(`Total assignments size: ${assignments.size}`);

  for (const [warehouseId, candidateOrders] of assignments.entries()) {
    logWithTime(
      `Assignment Cluster: ${warehouseId} - Candidate Orders ( Count: ${
        candidateOrders.length
      }: ${candidateOrders.map((o) => o.order_id)})`
    );

    if (candidateOrders.length < MIN_ORDERS) continue;

    const warehouse = warehouses.find((w) => w.id === warehouseId)!;
    if (!warehouse) continue;

    logWithTime(`Process Clusters for Warehouse: ${warehouseId} - Round 1`);
    const { ACCEPTED_CLUSTERS, TRIMMED_ORDERS } =
      await processWarehouseClusters(warehouse, candidateOrders);

    if (ACCEPTED_CLUSTERS.size) {
      accepted_Maps.set(warehouseId, ACCEPTED_CLUSTERS.get(warehouseId)!);
    }

    if (TRIMMED_ORDERS.size) {
      trimmed_Maps = new Map([...trimmed_Maps, ...TRIMMED_ORDERS]);
    }
  }

  // Retry trimmed orders once
  if (trimmed_Maps.size) {
    logWithTime(
      `trimmed_Maps.entries(): ${JSON.stringify(trimmed_Maps.entries())}`
    );

    for (const [warehouseId, trimmedList] of trimmed_Maps.entries()) {
      const warehouse = warehouses.find((w) => w.id === warehouseId)!;
      if (!warehouse) continue;

      logWithTime(`Process Clusters for Warehouse: ${warehouseId} - Round 2`);
      const { ACCEPTED_CLUSTERS: accept2 } = await processWarehouseClusters(
        warehouse,
        trimmedList
      );

      if (accept2.size) {
        const prev = accepted_Maps.get(warehouseId) ?? [];
        accepted_Maps.set(warehouseId, prev.concat(accept2.get(warehouseId)!));
      }
      // leaving trimmed2 for next batch
    }
  }

  console.warn(`Proceeding towards Dynamic Tower Creation................`);
  console.warn("accepted_Maps size:", accepted_Maps.size);
  const limit = pLimit(5);
  const promises = Array.from(accepted_Maps.entries()).flatMap(
    ([warehouseId, clusters]) =>
      clusters.map((cluster) =>
        limit(async () => {
          await createDynamicTourForCluster(warehouseId, cluster);
        })
      )
  );
  await Promise.all(promises);

  console.warn(`Terminating towards Dynamic Tower Creation................`);
}

async function createDynamicTourForCluster(
  warehouseId: number,
  orders: Order[]
) {
  try {
    const tourPayload: DynamicTourPayload = {
      warehouse_id: warehouseId,
      orderIds: orders.map((o) => o.order_id).join(","),
      totalOrdersItemsQty: 0,
    };

    await createDynamicTourAsync(tourPayload);

    // console.info("res?.dynamicTour?.id!", res?.dynamicTour?.id!);
    // console.info("Triggering createDeliveryCostForTour...");
    // await createDeliveryCostForTour(res?.dynamicTour?.id!);

    console.info(
      `Successfully created tour for warehouse ${warehouseId}, Orders: ${orders.map(
        (o) => o.order_id
      )}`
    );
  } catch (err) {
    console.error(
      `Failed to create tour for warehouse ${warehouseId}, Orders: ${orders.map(
        (o) => o.order_id
      )}`,
      err
    );
  }
}

export async function processWarehouseClusters(
  warehouse: Warehouse,
  jaggedOrders: Order[]
) {
  const TRIMMED_ORDERS = new Map<number, Order[]>();
  const ACCEPTED_CLUSTERS = new Map<number, Order[][]>();
  // const ACCEPTED_CLUSTERS = new Map<
  //   number,
  //   { cluster: Order[]; approxHrs: number }[]
  // >();

  const clusters = helper.clusterOrders(jaggedOrders, warehouse);

  for (let cluster of clusters) {
    if (cluster.length < MIN_ORDERS) {
      logWithTime(
        `Order Clusters Length is not sufficient for cluster process`
      );
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
      continue;
    }

    // quick approximate check
    let approxSec = helper.secondsForApproxRoute(warehouse, cluster);
    logWithTime(
      `Orders Cluster ${cluster.length} approx Sec duration from Warehouse ${warehouse.id} - ${warehouse.town} is: ${approxSec}`
    );

    if (approxSec > TIME_WINDOW_HOURS * 3600) {
      const { fitted, trimmed } = helper.trimClusterToFit(warehouse, cluster);
      if (trimmed.length) {
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmed));
      }

      logWithTime(`Fitted Orders, ${fitted.length} : ${fitted}`);
      logWithTime(`Trimmed Orders, ${trimmed.length} : ${trimmed}`);
      logWithTime(
        `Fitted: ${fitted.length} and Removed: ${trimmed.length} Orders from Cluster`
      );
      logWithTime(`Fitted Order : ${fitted.map((o) => o.order_id).join(",")}`);

      cluster = fitted;
    }
    if (!cluster.length || cluster.length < MIN_ORDERS) continue;

    try {
      console.log(`Matrix Call --------------------- 1`);

      //   const { tourDurationSec } = await getWarehouseToOrdersMetrix(
      //     warehouse,
      //     cluster
      //   );
      //   console.log(`tourDurationSec From METRIX : ${tourDurationSec}`);

      if (
        (approxSec == null && approxSec <= TIME_WINDOW_HOURS * 3600) ||
        (approxSec != null && approxSec <= TIME_WINDOW_HOURS * 3600)
      ) {
        const prev = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
        ACCEPTED_CLUSTERS.set(warehouse.id, [...prev, cluster]);
      }
      //   else {
      //     let fitted = [...cluster];
      //     const trimmedLocal: Order[] = [];
      // while (fitted.length >= MIN_ORDERS) {
      //   const toRemove = fitted.pop()!;
      //   trimmedLocal.push(toRemove);

      //   console.log(`Matrix Call --------------------- 2`);
      //   const { tourDurationSec: durMatrix_2 } = await getWarehouseToOrdersMetrix(
      //     warehouse,
      //     fitted
      //   );

      //   if (durMatrix_2 != null && durMatrix_2 <= TIME_WINDOW_HOURS * 3600) {
      //     const prev = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
      //     ACCEPTED_CLUSTERS.set(warehouse.id, [...prev, fitted]);
      //     break;
      //   }
      // }

      //     if (trimmedLocal.length) {
      //       const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      //       TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmedLocal));
      //     }
      //   }
    } catch (err) {
      console.error("getWarehouseToOrdersMetrix failed", err);
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
    }
  }

  console.warn(
    `processWarehouseClusters result for warehouse ${warehouse.id}:`,
    "ACCEPTED_CLUSTERS:",
    ACCEPTED_CLUSTERS.size,
    "TRIMMED_ORDERS:",
    TRIMMED_ORDERS.size
  );
  return { ACCEPTED_CLUSTERS, TRIMMED_ORDERS };
}
