import {
  getEndpointsRouteMatrix,
  getActiveWarehousesWithVehicles,
} from "../services/warehouse.service";
import { createDynamicTourAsync } from "../services/dynamicTour.service";

import { Order } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { MatrixData } from "../types/hereMap.types";
import { LogisticOrder } from "../model/LogisticOrders";
import { DynamicTourPayload } from "../types/dto.types";

import * as helper from "./assignmentWorker.helper";
import logger from "../config/logger";
import * as metrixHelper from "./utils/matrixAccessor";
import { grossWeight } from "./utils/ordersNetWeight";

const MATRIX_CONCURRENCY = 7; // Concurrent calls
const TIME_WINDOW_HOURS = 10;
const MAX_TOUR_DISTANCE_METERS = 600 * 1000;
// const SERVICE_TIME_PER_STOP_MIN = 5;
// const AVERAGE_SPEED_KMPH = 100;

const MIN_WEIGHT = 1250; // warehouse.gross_weight_kg!;
const MAX_WEIGHT = MIN_WEIGHT + 150;

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

const TIME_TOLERANCE_PERCENT = 0.05;
const DISTANCE_TOLERANCE_PERCENT = 0.1;

async function trimClusterToFitUsingMatrix(
  warehouse: Warehouse,
  cluster: Order[]
): Promise<{ fitted: Order[]; trimmed: Order[] }> {
  const allowedTime = TIME_WINDOW_HOURS * 3600 * (1 + TIME_TOLERANCE_PERCENT);
  const allowedDistance =
    MAX_TOUR_DISTANCE_METERS * (1 + DISTANCE_TOLERANCE_PERCENT);

  const trimmed: Order[] = [];

  const clusterWeight = grossWeight(cluster);
  if (!cluster.length || clusterWeight < MIN_WEIGHT)
    return { fitted: [], trimmed: [] };

  // cache key
  const clusterKey = `matrix:${warehouse.id}:${cluster
    .map((o) => o.order_id)
    .join(",")}`;

  // concurrency control
  await matrixSemaphore.enter();
  try {
    // caching
    let matrix = await cacheGet<MatrixData | undefined>(clusterKey);

    // Cluster and Matrix Map
    const clusterIndexMap = new Map<number, number>();

    if (!matrix) {
      matrix = await getEndpointsRouteMatrix(warehouse, cluster);

      if (matrix && (!matrix.errorCodes || matrix.errorCodes.length === 0)) {
        cluster.forEach((order, idx) => {
          clusterIndexMap.set(order.order_id, idx);
        });

        await cacheSet(clusterKey, matrix);
      } else {
        matrix = undefined;
        logger.warn("Matrix Empty, no response from Here API");
      }
    }

    if (!matrix) {
      // fallback to approximate
      logger.info(
        `[Seconds Approx Route] fallback for (${warehouse.id}-${warehouse.town}
          , cluster ${cluster.length}: ${cluster
          .map((o) => o.order_id)
          .join(",")} )`
      );
      const approxSec = helper.secondsForApproxRoute(warehouse, cluster);
      logger.info(
        `[Seconds Approx Route] ${approxSec} Approx Seconds for (${
          warehouse.id
        }-${warehouse.town}
          , cluster ${cluster.length}: ${cluster
          .map((o) => o.order_id)
          .join(",")} )`
      );

      if (approxSec <= TIME_WINDOW_HOURS * 3600)
        return { fitted: cluster, trimmed: [] };

      let fitted = cluster;
      // while (fitted.length >= MIN_ORDERS) {
      while (grossWeight(fitted) >= MIN_WEIGHT) {
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

    // matrix exists, compute duration sec
    const durationSec = metrixHelper.computeTourDurationUsingMatrix(
      matrix!,
      cluster,
      clusterIndexMap
    );

    // compute distance meters
    const distanceMeters = metrixHelper.computeTourDistanceUsingMatrix(
      matrix!,
      cluster,
      clusterIndexMap
    );

    logger.info(`durationSec: ${durationSec}`);
    logger.info(`distanceMeters: ${distanceMeters}`);
    logger.info(`allowedDistance Tolerance: ${allowedDistance}`);

    if (durationSec <= allowedTime && distanceMeters <= allowedDistance) {
      logger.info("Round 1st: Cluster Accepted as is");
      logger.info(
        `Cluster Accepted: WH ${warehouse.id}-${warehouse.town}, ${
          cluster.length
        } Orders:
         ${cluster.map((o) => o.order_id).join(",")} `
      );

      cacheDel(clusterKey);
      return { fitted: cluster, trimmed: [] };
    } else if (cluster.length <= 6 && durationSec <= allowedTime) {
      while (cluster.length) {
        // const atlastWeight = grossWeight([cluster.at(-1)!]);
        const lastOrderWeight = cluster.at(-1)?.weight_kg!;
        if (clusterWeight - lastOrderWeight < MIN_WEIGHT)
          return { fitted: cluster, trimmed: [] };

        cluster.pop();
      }
    }

    let fitted = cluster;
    // while (fitted.length >= MIN_ORDERS) {
    while (grossWeight(fitted) >= MIN_WEIGHT) {
      // const lastOrderWeight = fitted.at(-1)?.weight_kg!;
      // if (grossWeight(fitted) - lastOrderWeight < MIN_WEIGHT)
      //   return { fitted: cluster, trimmed: [] };

      trimmed.push(fitted.pop()!);

      const dur_sec_2 = metrixHelper.computeTourDurationUsingMatrix(
        matrix,
        fitted,
        clusterIndexMap
      );
      const dis_mtr_2 = metrixHelper.computeTourDistanceUsingMatrix(
        matrix,
        fitted,
        clusterIndexMap
      );
      logger.info(`dur_sec_2: ${dur_sec_2}`);
      logger.info(`dis_mtr_2: ${dis_mtr_2}`);

      if (dur_sec_2 <= allowedTime && dis_mtr_2 <= allowedDistance) {
        cacheDel(clusterKey);
        return { fitted, trimmed };
      } else {
        continue;
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

  const candidateClusters = helper.clusterOrdersByDensDirection(
    candidateOrders,
    warehouse
  );

  logger.info(
    `Warehouse ${warehouse.town} has Clusters: ${candidateClusters.length} \n
     Cluster weight follows as:`
  );
  candidateClusters.forEach((cluster, idx) => {
    logger.info(`${idx + 1} Cluster weight: ${grossWeight(cluster)}`);
  });

  for (const cluster of candidateClusters) {
    const clusterWeight = grossWeight(cluster);

    // if (cluster.length < MIN_ORDERS)
    if (clusterWeight < MIN_WEIGHT || clusterWeight > MAX_WEIGHT) {
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
      continue;
    }

    try {
      const { fitted, trimmed } = await trimClusterToFitUsingMatrix(
        warehouse,
        cluster
      );
      // debugger;

      if (trimmed.length) {
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmed));
      }

      if (fitted.length > 0) {
        const prevAcc = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
        ACCEPTED_CLUSTERS.set(warehouse.id, prevAcc.concat([fitted]));
      } else {
        // all were trimmed
      }
    } catch (err) {
      logger.error("[Trim Cluster] Error trimming cluster", err);
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(cluster));
    }
  }
  return { ACCEPTED_CLUSTERS, TRIMMED_ORDERS };
}

export async function processBatch() {
  logger.info("[Batch Process] Starting batch processing of orders...");

  const orders = await LogisticOrder.pendingOrdersWithWeightAndItems();
  if (!orders.length) {
    logger.warn("[Batch Process] No pending orders found. Exiting.");
    return;
  }

  const warehouses = await getActiveWarehousesWithVehicles();
  if (!warehouses.length) {
    logger.warn("[Batch Process] No active warehouses found. Exiting.");
    return;
  }

  const assignments: Map<number, { order: Order; distance?: number }[]> =
    await helper.warehouseOrdersAssignment(warehouses, orders);

  logger.info(
    `[Batch Process] Started \n 
    Fetched ${orders.length} orders and ${warehouses.length} warehouses`
  );

  logger.info(
    `[Batch Process] Creating Request for ${assignments.size} assignments Clusters`
  );

  for (const [warehouseId, orderEntries] of assignments.entries()) {
    if (!orderEntries.length) continue;

    orderEntries.sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    );
    assignments.set(warehouseId, orderEntries);

    const warehouse = warehouses.find((w) => w.id === warehouseId)!;
    if (!warehouse) {
      logger.error(`[Batch Process] Warehouse ID ${warehouseId} not found`);
      continue;
    }

    const candidOrders: Order[] = orderEntries.map((e) => e.order);
    // if (grossWeight(candidOrders) < MIN_WEIGHT) {
    if (grossWeight(candidOrders) < warehouse.loadingWeightKg!) {
      logger.warn(
        `[Batch Process] [Warehouse ${warehouseId}] Skipped due to insufficient total weight (${grossWeight(
          candidOrders
        )} kg)`
      );
      continue;
    }

    const { ACCEPTED_CLUSTERS, TRIMMED_ORDERS } =
      await processWarehouseClusters(warehouse, candidOrders);

    for (const [wid, trimmedOrders] of TRIMMED_ORDERS.entries()) {
      const wh = warehouses.find((wh) => wh.id === wid);
      logger.warn(
        `[Trimmed Orders] ${
          trimmedOrders.length
        } orders trimmed for warehouse ${wh?.town ?? "Unknown"} (ID: ${wid})`
      );
    }

    for (const clusters of ACCEPTED_CLUSTERS.values()) {
      for (const cluster of clusters) {
        logger.info(
          `[Accepted Clusters] Creating dynamic tour for ${warehouse.town} — Total clusters: ${clusters.length}, Current cluster size: ${cluster.length}`
        );
        await createDynamicTourForCluster(warehouseId, cluster);
      }
    }
  }
  logger.info("[Batch Process] Completed successfully.");
}

async function createDynamicTourForCluster(
  warehouseId: number,
  orders: Order[]
) {
  try {
    const tourPayload: DynamicTourPayload = {
      warehouse_id: warehouseId,
      orderIds: orders.map((o) => o.order_id).join(","),
    };
    logger.info(
      `[Dynamic Tours] Creating tour: WH ${warehouseId} with orders: ${tourPayload.orderIds}`
    );
    await createDynamicTourAsync(tourPayload);

    logger.info(
      `[Dynamic Tours] Successfully created tour: WH ${warehouseId}, Orders: ${orders.map(
        (o) => o.order_id
      )}`
    );
  } catch (err) {
    logger.error(
      `[Dynamic Tours] Failed to create tour: WH ${warehouseId}, Orders: ${orders.map(
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
    logger.info(`[Batch Process] active: ${current}, queued: ${queue.length}`);

    const next = queue.shift();
    if (next) next();

    if (current === 0 && queue.length === 0) {
      flushCache();
    }
  }
  return { enter, leave };
}
export const matrixSemaphore = semaphore(MATRIX_CONCURRENCY);
