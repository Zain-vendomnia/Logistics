import { getActiveWarehousesWithVehicles } from "../services/warehouse.service";
import { createDynamicTourAsync } from "../services/dynamicTour.service";

import { Order, OrderType } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { LogisticOrder } from "../model/LogisticOrders";
import { DynamicTourPayload } from "../types/dto.types";

import {
  assignmentHelper,
  warehouseOrdersAssignment,
} from "./assignmentWorker.helper";
import logger from "../config/logger";
import { grossWeight } from "./utils/ordersNetWeight";

export async function processWarehouseClusters(
  warehouse: Warehouse,
  candidateOrders: Order[]
) {
  const helper = assignmentHelper(warehouse);

  logger.warn(
    `[Process Clusters] Processing WH ${warehouse.town} with ${candidateOrders.length} candidate orders`
  );

  const TRIMMED_ORDERS = new Map<number, Order[]>();
  const ACCEPTED_CLUSTERS = new Map<number, Order[][]>();

  // if (grossWeight(candidOrders) < MIN_WEIGHT) {
  if (grossWeight(candidateOrders) < helper.MIN_WEIGHT) {
    logger.warn(
      `[Process Clusters] [Warehouse ${warehouse.id}|${
        warehouse.town
      }] Skipped due to insufficient total weight (${grossWeight(
        candidateOrders
      )} kg < ${helper.MIN_WEIGHT} kg)`
    );
    return { ACCEPTED_CLUSTERS, TRIMMED_ORDERS };
  }

  const candidateClusters = await helper.clusterOrdersByDensDirection(
    candidateOrders
  );

  logger.info(
    `[Process Clusters] Warehouse ${warehouse.town} has Cluster(s): ${candidateClusters.length} \n
     Cluster weight follows as:`
  );
  candidateClusters
    .map((c) => c.cluster)
    .forEach((cluster, idx) => {
      logger.info(`${idx + 1} Cluster weight: ${grossWeight(cluster)}`);
    });

  for (const txnCluster of candidateClusters) {
    // const cluster = txnCluster.cluster;
    const clusterWeight = grossWeight(txnCluster.cluster);

    // clusterWeight > helper.MAX_WEIGHT
    if (clusterWeight < helper.MIN_WEIGHT) {
      const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(txnCluster.cluster));
      continue;
    } else if (clusterWeight > helper.MAX_WEIGHT) {
      while (grossWeight(txnCluster.cluster) > helper.MAX_WEIGHT) {
        const trimmedOrder = txnCluster.cluster.pop()!;
        const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.set(warehouse.id, prev.concat([trimmedOrder]));
      }
    }

    try {
      const { fitted, trimmed } = await helper.trimClusterToFitUsingMatrix(
        txnCluster.cluster,
        { tier: txnCluster.tier }
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
      TRIMMED_ORDERS.set(warehouse.id, prev.concat(txnCluster.cluster));
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
    await warehouseOrdersAssignment(warehouses, orders);

  logger.info(
    `[Batch Process] Started.
    Fetched ${orders.length} orders and ${warehouses.length} warehouses`
  );

  logger.info(
    `[Batch Process] Creating Request for ${assignments.size} assignments Clusters`
  );

  for (const [warehouseId, orderEntries] of assignments.entries()) {
    if (!orderEntries.length) continue;
    if (warehouseId !== 10) continue; // Hamburg
    // if (warehouseId !== 2) continue; // Berlin

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

    logger.warn(
      `Urgent Orders: ${
        candidOrders.filter((o) => o.type === OrderType.URGENT).length
      }`
    );

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
