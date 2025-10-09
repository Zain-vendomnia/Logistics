import {
  getWarehouseLocationCords,
  getWarehouseZipcodesRecord,
  getWarehouseToOrdersMatrix,
  getActiveWarehousesWithVehicles,
} from "../services/warehouse.service";
import { createDynamicTourAsync } from "../services/dynamicTour.service";

import { Order } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { MatrixData } from "../types/hereMap.types";
import { LogisticOrder } from "../model/LogisticOrders";
import { DynamicTourPayload } from "../types/dto.types";

import * as helper from "./assignmentWorker.helper";
import { haversineKm } from "../helpers/tour.helper";

// const SECTOR_ANGLE_DEG = 30;
// const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;
const MATRIX_CONCURRENCY = 7; // Concurrent calls

const MIN_ORDERS = 10;
// const MAX_CLUSTER_SIZE = 32;
const CLOSE_TO_DISTANCE_KM = 25; // between consecutive orders (your local value)
const TIME_WINDOW_HOURS = 10;
const MAX_TOUR_DISTANCE_METERS = 600 * 1000; // 600 km -> meters
// const SERVICE_TIME_PER_STOP_MIN = 5;
// const AVERAGE_SPEED_KMPH = 100;

const simpleCache = new Map<string, any>();
async function cacheGet<T>(k: string): Promise<T | undefined> {
  return simpleCache.get(k);
}
async function cacheSet(k: string, v: any, ttl = 6 * 60000) {
  simpleCache.set(k, v);
  setTimeout(() => {
    simpleCache.delete(k);
    console.log(`Cache expired for key: ${k}`);
  }, ttl);
}
async function cacheDel(k: string) {
  if (simpleCache.has(k)) {
    simpleCache.delete(k);
    console.log(`Cache deleted for key: ${k}`);
  }
}
async function flushCache() {
  simpleCache.clear();
  console.warn("Cache flushed");
}

async function trimClusterToFitUsingMatrix(
  warehouse: Warehouse,
  cluster: Order[]
): Promise<{ fitted: Order[]; trimmed: Order[] }> {
  const trimmed: Order[] = [];
  if (!cluster.length) return { fitted: [], trimmed };

  // cache key
  const clusterKey = `matrix:${warehouse.id}:${cluster
    .map((o) => o.order_id)
    .join(",")}`;

  // concurrency control
  await matrixSemaphore.enter();
  try {
    // caching
    let matrix = await cacheGet<MatrixData | undefined>(clusterKey);

    if (!matrix) {
      matrix = await getWarehouseToOrdersMatrix(warehouse, cluster);

      if (matrix && (!matrix.errorCodes || matrix.errorCodes.length === 0)) {
        await cacheSet(clusterKey, matrix);
      } else {
        matrix = undefined;
        console.warn("Matrix Empty, no response form Here API");
      }
    }

    if (!matrix) {
      // fallback to approximate
      const approxSec = helper.secondsForApproxRoute(warehouse, cluster);

      console.warn(
        `secondsForApproxRoute(${warehouse.town}, cluster ${cluster.length})`
      );
      console.warn(`approxSec: ${approxSec}`);

      if (approxSec <= TIME_WINDOW_HOURS * 3600)
        return { fitted: cluster, trimmed: [] };

      // const sortedByDist = [...cluster].sort(
      //   (a, b) =>
      //     haversineKm(
      //       warehouse.lat!,
      //       warehouse.lng!,
      //       a.location.lat!,
      //       a.location.lng!
      //     ) -
      //     haversineKm(
      //       warehouse.lat!,
      //       warehouse.lng!,
      //       b.location.lat!,
      //       b.location.lng!
      //     )
      // );
      // const fitted = [...sortedByDist];
      let fitted = cluster;
      while (fitted.length >= MIN_ORDERS) {
        trimmed.push(fitted.pop()!);
        const approxNow = helper.secondsForApproxRoute(warehouse, fitted);
        if (approxNow <= TIME_WINDOW_HOURS * 3600)
          return {
            fitted,
            trimmed: trimmed.concat(cluster.filter((o) => !fitted.includes(o))),
          };
      }

      return { fitted: [], trimmed: trimmed.concat(fitted) };
    }

    // matrix exists, compute tour duration
    const durationSec = helper.computeTourDurationUsingMatrix(matrix!, cluster);
    console.warn(
      `Matrix Duration: ${durationSec / 3600}h for cluster size ${
        cluster.length
      }`
    );

    // compute distance meters
    const distanceMeters = helper.computeTourDistanceUsingMatrix(
      matrix!,
      cluster
    );
    console.warn(
      `Matrix Distance: ${distanceMeters / 1000}Km for cluster size ${
        cluster.length
      }`
    );

    if (
      durationSec <= TIME_WINDOW_HOURS * 3600 &&
      distanceMeters <= MAX_TOUR_DISTANCE_METERS
    ) {
      console.warn("Round 1st: Cluster Accepted as is");
      console.warn(
        `Cluster Accepted: warehouse ${warehouse.town} legnth ${cluster.length}`
      );

      cacheDel(clusterKey);
      return { fitted: cluster, trimmed: [] };
    }

    let fitted = cluster;
    while (fitted.length >= MIN_ORDERS) {
      trimmed.push(fitted.pop()!);

      const newKey = `matrix:${warehouse.id}:${fitted
        .map((o) => o.order_id)
        .join(",")}`;

      let matrix2 = await cacheGet<MatrixData | undefined>(newKey);
      if (!matrix2) {
        try {
          matrix2 = await getWarehouseToOrdersMatrix(warehouse, fitted);
          if (
            matrix2 &&
            (!matrix2.errorCodes || matrix2.errorCodes.length === 0)
          ) {
            await cacheSet(newKey, matrix2);
          } else {
            matrix2 = undefined;
          }
        } catch (err) {
          matrix2 = undefined;
        }
      }
      if (!matrix2) {
        const approxSec = helper.secondsForApproxRoute(warehouse, fitted);
        if (approxSec <= TIME_WINDOW_HOURS * 3600) {
          return { fitted, trimmed };
        } else {
          continue;
        }
      } else {
        const dur_sec_2 = helper.computeTourDurationUsingMatrix(
          matrix2,
          fitted
        );
        const dis_mtr_2 = helper.computeTourDistanceUsingMatrix(
          matrix2,
          fitted
        );
        if (
          dur_sec_2 <= TIME_WINDOW_HOURS * 3600 &&
          dis_mtr_2 <= MAX_TOUR_DISTANCE_METERS
        ) {
          cacheDel(newKey);
          return { fitted, trimmed };
        } else {
          continue;
        }
      }
    }

    return { fitted: [], trimmed: trimmed.concat(fitted) };
  } finally {
    matrixSemaphore.leave();
  }
}

export async function processWarehouseClusters(
  warehouse: Warehouse,
  candidateOrders: Order[]
) {
  const TRIMMED_ORDERS = new Map<number, Order[]>();
  const ACCEPTED_CLUSTERS = new Map<number, Order[][]>();

  const candidateClusters = helper.clusterOrdersBySector(
    candidateOrders,
    warehouse
  );

  for (const cluster of candidateClusters) {
    if (cluster.length < MIN_ORDERS) {
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
      continue;
    }

    try {
      const { fitted, trimmed } = await trimClusterToFitUsingMatrix(
        warehouse,
        cluster
      );
      if (trimmed.length) {
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmed));
      }

      if (fitted.length >= MIN_ORDERS) {
        const prevAcc = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
        ACCEPTED_CLUSTERS.set(warehouse.id, prevAcc.concat([fitted]));
      } else {
        // all were trimmed
      }
    } catch (err) {
      console.error("Error trimming cluster", err);
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
    }
  }
  return { ACCEPTED_CLUSTERS, TRIMMED_ORDERS };
}

export async function processBatch() {
  // fetch orders, warehouses
  const orders: Order[] = await LogisticOrder.getPendingOrdersAsync();
  if (!orders.length) return;

  debugger;

  const warehouses: Warehouse[] = await getActiveWarehousesWithVehicles();
  if (!warehouses.length) return;

  // ensure coords
  for (const wh of warehouses) {
    if (!wh.lat || !wh.lng) {
      const location = await getWarehouseLocationCords(wh);
      if (location) {
        wh.lat = location.lat;
        wh.lng = location.lng;
      } else continue;
    }
  }
  for (const order of orders) {
    if (!order.location.lat || !order.location.lng) {
      const location = await LogisticOrder.getOrderLocationCords(order);
      if (location) {
        order.location.lat = location.lat;
        order.location.lng = location.lng;
      } else continue;
    }
  }

  // assign to warehouses
  const assignments = new Map<number, Order[]>();
  const warehouse_zipMap = await getWarehouseZipcodesRecord(
    warehouses.map((w) => w.id)
  );
  for (const order of orders) {
    let best = null;
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

    const chosenWarehouses: Warehouse[] = [];
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
            CLOSE_TO_DISTANCE_KM
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

  console.log(`Creating Dynamic Tours for ${assignments.size} Clusters`);
  for (const [warehouseId, candidateOrders] of assignments.entries()) {
    if (candidateOrders.length < MIN_ORDERS) continue;

    const warehouse = warehouses.find((w) => w.id === warehouseId)!;

    const { ACCEPTED_CLUSTERS, TRIMMED_ORDERS } =
      await processWarehouseClusters(warehouse, candidateOrders);

    for (const [wid, trimmedOrders] of TRIMMED_ORDERS.entries()) {
      // trimmedOrders for next round
      console.warn(
        `Warehouse ${wid} has ${trimmedOrders.length} trimmed Orders.`
      );
    }

    // Creating dynamic tours for ACCEPTED_CLUSTERS
    for (const clusters of ACCEPTED_CLUSTERS.values()) {
      for (const cluster of clusters) {
        console.log(
          `Warehouse ${warehouse.town} total clusters:${clusters.length}| cluster:${cluster.length}`
        );
        await createDynamicTourForCluster(warehouseId, cluster);
      }
    }
  }
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

function semaphore(max: number) {
  let current = 0;
  const queue: (() => void)[] = [];
  async function enter() {
    if (current < max) {
      current++;
      return;
    }
    await new Promise<void>((res) => queue.push(res));
    current++;
  }
  function leave() {
    current--;
    console.log(`[Batch Process] active: ${current}, queued: ${queue.length}`);

    const next = queue.shift();
    if (next) next();

    if (current === 0 && queue.length === 0) {
      flushCache();
    }
  }
  return { enter, leave };
}
export const matrixSemaphore = semaphore(MATRIX_CONCURRENCY);
