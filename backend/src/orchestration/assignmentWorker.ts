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

  // const TRIMMED_ORDERS = new Map<number, Order[]>();
  // const ACCEPTED_CLUSTERS = new Map<number, Order[][]>();

  const TRIMMED_ORDERS: Order[] = [];
  const ACCEPTED_CLUSTERS: Order[][] = [];

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

  const { geoClusters, leftovers } = await helper.clusterOrdersByDensDirection(
    candidateOrders
  );

  TRIMMED_ORDERS.push(...leftovers);

  logger.info(
    `[Process Clusters] Warehouse ${warehouse.town} has Cluster(s): ${geoClusters.length} \n
     Cluster weight follows as:`
  );
  console.log(
    `[Process Clusters] Warehouse ${warehouse.town} has Cluster(s): ${geoClusters.length} \n
     Cluster weight follows as:`
  );
  geoClusters
    .map((c) => c.cluster)
    .forEach((cluster, idx) => {
      logger.info(`${idx + 1} Cluster weight: ${grossWeight(cluster)}`);
    });

  for (const txnCluster of geoClusters) {
    // const cluster = txnCluster.cluster;
    const clusterWeight = grossWeight(txnCluster.cluster);

    // clusterWeight > helper.MAX_WEIGHT
    if (clusterWeight < helper.MIN_WEIGHT) {
      // const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
      TRIMMED_ORDERS.push(...txnCluster.cluster);
      continue;
    }

    if (clusterWeight > helper.MAX_WEIGHT) {
      while (grossWeight(txnCluster.cluster) > helper.MAX_WEIGHT) {
        const trimmedOrder = txnCluster.cluster.pop()!;
        // const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
        TRIMMED_ORDERS.push(trimmedOrder);
      }
    }
    ACCEPTED_CLUSTERS.push(txnCluster.cluster);

    // try {
    //   const { fitted, trimmed } = await helper.trimClusterToFitTimeWindow(
    //     txnCluster.cluster,
    //     { tier: txnCluster.tier }
    //   );

    //   if (trimmed.length) {
    //     const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
    //     TRIMMED_ORDERS.set(warehouse.id, prev.concat(trimmed));
    //   }

    //   if (fitted.length > 0) {
    // const prevAcc = ACCEPTED_CLUSTERS.get(warehouse.id) ?? [];
    // ACCEPTED_CLUSTERS.set(warehouse.id, prevAcc.concat([fitted]));
    //   } else {
    //     // all were trimmed
    //   }
    // } catch (err) {
    //   logger.error("[Trim Cluster] Error trimming cluster", err);
    //   const prev = TRIMMED_ORDERS.get(warehouse.id) ?? [];
    //   TRIMMED_ORDERS.set(warehouse.id, prev.concat(txnCluster.cluster));
    // }
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

  // const urgent_orders = orders.filter((o) => o.type === OrderType.URGENT);
  // logger.info(`Urgent Order: ${urgent_orders.length}:  ${urgent_orders}`);

  const assignments: Map<number, { order: Order; distance?: number }[]> =
    await warehouseOrdersAssignment(warehouses, orders);

  logger.info(
    `[Batch Process] Started.
    Fetched ${orders.length} orders and ${warehouses.length} warehouses`
  );

  logger.info(
    `[Batch Process] Creating Request for ${assignments.size} Warehouses`
  );

  const results: Map<string, Order[][]> = new Map();
  const failed: Map<string, Order[][]> = new Map();

  for (const [warehouseId, orderEntries] of assignments.entries()) {
    if (!orderEntries.length) continue;
    // if (warehouseId !== 1) continue; // Eschwege
    if (warehouseId === 2) continue; // Berlin
    // if (warehouseId === 3) continue; // Schkeuditz
    // if (warehouseId === 4) continue; // Mainz-Kastel
    // if (warehouseId === 6) continue; // Rheine
    // if (warehouseId === 7) continue; // Bönen
    // if (warehouseId === 8) continue; // Nürnberg
    // if (warehouseId === 9) continue; // Muenchen
    // if (warehouseId !== 10) continue; // Hamburg

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

    console.log(
      "order ids",
      candidOrders.map((o) => o.order_id)
    );

    const { ACCEPTED_CLUSTERS, TRIMMED_ORDERS } =
      await processWarehouseClusters(warehouse, candidOrders);

    if (ACCEPTED_CLUSTERS.length > 0) {
      if (!results.has(warehouse.town)) results.set(warehouse.town, []);
      const existing = results.get(warehouse.town)!;
      existing.push(...ACCEPTED_CLUSTERS);
      results.set(warehouse.town, existing);
    }
    if (TRIMMED_ORDERS.length > 0) {
      if (!failed.has(warehouse.town)) failed.set(warehouse.town, []);
      const existing = failed.get(warehouse.town)!;
      existing.push(TRIMMED_ORDERS);
      failed.set(warehouse.town, existing);
    }


    // const wh = warehouses.find((wh) => wh.id === wid);
    logger.warn(
      `[Trimmed Orders] ${TRIMMED_ORDERS.length} orders trimmed for warehouse ${
        warehouse?.town ?? "Unknown"
      } (ID: ${warehouse.id})`
    );

    for (const cluster of ACCEPTED_CLUSTERS) {
      logger.info(
        `[Accepted Clusters] Creating dynamic tour for ${warehouse.town} — Cluster Size: ${cluster.length}.`
      );
      await createDynamicTourForCluster(warehouseId, cluster);
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
