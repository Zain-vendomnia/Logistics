import logger from "../config/logger";
import {
  getWarehouseLocationCords,
  getWarehouseZipcodesRecord,
} from "../services/warehouse.service";

import { Order } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { LogisticOrder, OrderType } from "../model/LogisticOrders";

import { haversineKm } from "./utils/haversineKm";
import { grossWeight } from "./utils/ordersNetWeight";

import {
  approxSecForRoute,
  findBestInsertPosition,
  scoreCluster,
} from "./utils/orderCluster.util";
import { sortByWarehouse } from "./utils/sortByWarehouse";
import { effectiveWeight, isPriority } from "./utils/priority";

const MATRIX_CONCURRENCY = 7;
const CLOSE_TO_DISTANCE_KM = 40; // between consecutive orders
// const SERVICE_TIME_PER_STOP_MIN = 5;
// const AVERAGE_SPEED_KMPH = 100;

export async function warehouseOrdersAssignment(
  warehouses: Warehouse[],
  orders: Order[]
): Promise<Map<number, { order: Order; distance?: number }[]>> {
  const assignments = new Map<number, { order: Order; distance?: number }[]>();

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
    if (!order.location || !order.location.lat || !order.location.lng) {
      const location = await LogisticOrder.getOrderLocationCords(order);
      if (location) {
        order.location.lat = location.lat;
        order.location.lng = location.lng;
      } else continue;
    }
  }

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
      const distFromWH =
        haversineKm(
          zipcodeOwner.lat!,
          zipcodeOwner.lng!,
          order.location.lat!,
          order.location.lng!
        ) - CLOSE_TO_DISTANCE_KM;

      if (best!.id !== zipcodeOwner.id && bestDist + 0.1 <= distFromWH) {
        chosenWarehouses.push(best!);
      } else {
        chosenWarehouses.push(zipcodeOwner);
        bestDist = distFromWH;
      }
    } else {
      chosenWarehouses.push(best!);
    }

    for (const wh of chosenWarehouses) {
      if (!assignments.has(wh.id)) assignments.set(wh.id, []);
      assignments.get(wh.id)!.push({ order: order, distance: bestDist });
    }
  }

  return assignments;
}

export function assignmentHelper(warehouse: Warehouse) {
  // const Vehicle_Count = warehouse.vehicles?.length ?? 1;
  const Vehicle_Count = 2;

  // Weight limits
  const MAX_WEIGHT = 1290;
  const lowerhead = 0.2 * MAX_WEIGHT; // fixed 20% lowerhead
  const MIN_WEIGHT = MAX_WEIGHT - lowerhead;
  // const WEIGHT = warehouse.loadingWeightKg ?? 1550;
  // const lowerhead =
  //   WEIGHT <= 1200
  //     ? WEIGHT * 0.05 // 5% lowerhead
  //     : WEIGHT <= 1460
  //     ? WEIGHT * 0.1 // 10% lowerhead
  //     : WEIGHT * 0.15; // 15% lowerhead
  // const MIN_WEIGHT = WEIGHT - lowerhead;
  // const MAX_WEIGHT = WEIGHT * 1.2; // 20% overhead

  const ordersById = new Map<
    number,
    Order & { distance?: number; angle?: number }
  >();

  // Time limits
  const TIME_WINDOW_HOURS = 10;
  const ACCEPABLE_TIME_MARGIN = 0.1; // 10% over allowed time window
  const TIMEALLOWED_1DAY = TIME_WINDOW_HOURS * 3600;
  const TIMEALLOWED_2DAY = 18 * 3600;
  const TIMEALLOWED_MIN_1DAY = TIMEALLOWED_1DAY * (1 - ACCEPABLE_TIME_MARGIN);
  const TIMEALLOWED_MAX_2DAY = TIMEALLOWED_2DAY * (1 + ACCEPABLE_TIME_MARGIN);

  function clusterCentroid(cluster: Order[]) {
    if (cluster.length > 0) {
      const lat =
        cluster.reduce((sum, o) => sum + +o.location.lat!, 0) / cluster.length;
      const lng =
        cluster.reduce((sum, o) => sum + +o.location.lng!, 0) / cluster.length;
      return { lat, lng };
    }
    return { lat: warehouse.lat!, lng: warehouse.lng! };
  }

  function tryInsertOrder(
    cluster: Order[],
    order: Order
  ): { candidate: Order[]; deltaTime: number } | null {
    const insert = findBestInsertPosition(warehouse, cluster, order);
    if (!insert || insert.pos < 0) return null;

    const candidate = [
      ...cluster.slice(0, insert.pos),
      order,
      ...cluster.slice(insert.pos),
    ];

    const newTime = approxSecForRoute(warehouse, candidate);
    const oldTime = approxSecForRoute(warehouse, cluster);

    return {
      candidate,
      deltaTime: newTime - oldTime,
    };
  }

  function findNearbyClustersToFitWeightExtended(
    cluster: Order[],
    pendingSectors: Order[][],
    isUrgent: boolean = false
  ): { cluster: Order[]; remainingOrders: Order[] } {
    // const time_Limit = isUrgent ? TIMEALLOWED_MAX_2DAY : TIMEALLOWED_1DAY;

    let updatedCluster = [...cluster];
    let currentWeight = grossWeight(updatedCluster);
    let currentTime = approxSecForRoute(warehouse, updatedCluster);

    // Clone sectors so we can remove consumed orders
    const sectors = pendingSectors.map((s) => [...s]);

    const tryFitUnderTimeLimit = (time_Limit: number): boolean => {
      let improved = false;
      while (currentWeight < MAX_WEIGHT && currentTime < time_Limit) {
        let best: {
          sectorIdx: number;
          orderIdx: number;
          candidate: Order[];
          score: number;
          newTime: number;
          addedWeight: number;
        } | null = null;

        const lastOrder = updatedCluster.at(-1)!;

        // Scan all nearby sectors
        for (let sectorIdx = 0; sectorIdx < sectors.length; sectorIdx++) {
          const sector = sectors[sectorIdx];
          if (!sector.length) continue;

          const first = sector[0];
          const dist = haversineKm(
            lastOrder.location.lat!,
            lastOrder.location.lng!,
            first.location.lat!,
            first.location.lng!
          );

          if (dist > CLOSE_TO_DISTANCE_KM * 2.3) continue;

          for (let orderIdx = 0; orderIdx < sector.length; orderIdx++) {
            const order = sector[orderIdx];

            const w = order.weight_kg ?? 0;
            if (currentWeight + w > MAX_WEIGHT) continue;

            const attempt = tryInsertOrder(updatedCluster, order);
            if (!attempt) continue;
            if (attempt.deltaTime <= 0) continue;

            const newTime = currentTime + attempt.deltaTime;
            if (newTime > time_Limit) continue;
            // if(!isUrgent && newTime > TIMEALLOWED_1DAY) continue;

            const score = w / attempt.deltaTime;

            if (!best || score > best.score) {
              best = {
                sectorIdx: sectorIdx,
                orderIdx: orderIdx,
                candidate: attempt.candidate,
                score,
                newTime,
                addedWeight: w,
              };
            }
          }
        }

        // Commit best candidate
        if (best) {
          updatedCluster = best!.candidate;
          currentWeight += best.addedWeight;
          currentTime = best.newTime;

          // Remove consumed order
          sectors[best.sectorIdx].splice(best.orderIdx, 1);
          improved = true;
        } else break;
      }

      return improved;
    };

    tryFitUnderTimeLimit(TIMEALLOWED_1DAY);

    if (isUrgent && currentWeight < MAX_WEIGHT) {
      tryFitUnderTimeLimit(TIMEALLOWED_MAX_2DAY);
    }

    // Collect leftovers
    const remainingOrders = sectors.flat();

    return {
      cluster: updatedCluster,
      remainingOrders,
    };
  }

  // merge pending sectors if possible with shorter cluster
  function findNearbyClustersToFitWeight(
    cluster: Order[],
    pendingSectors: Order[][],
    isUrgent: boolean = false
  ): { cluster: Order[]; remainingOrders: Order[] } {
    const time_Limit = isUrgent ? TIMEALLOWED_MAX_2DAY : TIMEALLOWED_1DAY;

    const remainingOrders: Order[] = [];

    let updatedCluster = [...cluster];
    let clusterWeight = grossWeight(updatedCluster);
    let clusterTime = approxSecForRoute(warehouse, updatedCluster);

    const sectors = pendingSectors.map((s) => [...s]);

    while (clusterWeight < MAX_WEIGHT && clusterTime < time_Limit) {
      const lastOrder = updatedCluster.at(-1)!;

      let nearestSectorIdx = -1;
      let nearestDist = Infinity;

      sectors.forEach((sector, idx) => {
        if (!sector.length) return;

        const first = sector[0];
        const d = haversineKm(
          lastOrder.location.lat!,
          lastOrder.location.lng!,
          first.location.lat!,
          first.location.lng!
        );

        if (d < nearestDist && d < CLOSE_TO_DISTANCE_KM * 2.3) {
          nearestDist = d;
          nearestSectorIdx = idx;
        }
      });

      // No sector found
      if (nearestSectorIdx === -1) break;

      const nearestSector = sectors.splice(nearestSectorIdx, 1)[0];

      let currentWeight = grossWeight(updatedCluster);
      // let currentTime = approxSecForRoute(warehouse, updatedCluster);

      for (const order of nearestSector) {
        const w = order.weight_kg ?? 0;

        if (currentWeight + w > MAX_WEIGHT) {
          remainingOrders.push(order);
          continue;
        }

        const insert = findBestInsertPosition(warehouse, updatedCluster, order);
        if (!insert || insert.pos < 0) {
          remainingOrders.push(order);
          continue;
        }

        const candidate = [
          ...updatedCluster.slice(0, insert.pos),
          order,
          ...updatedCluster.slice(insert.pos),
        ];

        const newTime = approxSecForRoute(warehouse, candidate);

        if (newTime > time_Limit) {
          remainingOrders.push(order);
          continue;
        }

        updatedCluster = candidate;
        currentWeight += w;
        // currentTime = newTime;
        clusterWeight += w;
        clusterTime = newTime;
      }
    }

    for (const sector of sectors) {
      remainingOrders.push(...sector);
    }

    return { cluster: updatedCluster, remainingOrders };
  }

  function trimClusterToFitWeight(
    cluster: Order[],
    type: "priority" | "normal"
  ) {
    let clusterWeight = cluster.reduce((sum, o) => sum + effectiveWeight(o), 0);

    const typeToTrim =
      type === "priority"
        ? OrderType.URGENT // PICKUP never trimmed
        : OrderType.NORMAL;

    const removedOrders: Order[] = [];

    while (clusterWeight > MAX_WEIGHT) {
      const lastOrderIndex = cluster
        .map((o, i) => ({ o, i }))
        .filter((x) => x.o.type === typeToTrim)
        .map((x) => x.i)
        .pop();

      if (lastOrderIndex === undefined) break;

      const [removed] = cluster.splice(lastOrderIndex, 1);
      clusterWeight -= removed.weight_kg ?? 0;
      removedOrders.push(removed);
    }

    return { cluster, removedOrders };
  }

  function buildUrgentClusterOptimized(
    orders: Order[],
    config?: {
      allow2DaysTour?: boolean;
    }
  ): {
    cluster: Order[];
    remainingOrders: Order[];
  } {
    if (!orders?.length) return { cluster: [], remainingOrders: [] };

    const allow2DaysTour = config?.allow2DaysTour ?? true;

    const ordersSorted = sortByWarehouse(warehouse, orders);

    let cluster: Order[] = [];
    const remainingOrders: Order[] = [];
    const unprocessed = new Set(ordersSorted.map((o) => o.order_id));

    // const urgents = ordersSorted.filter((o) => o.type === OrderType.URGENT);
    // let urgentWeight = grossWeight(urgents);
    const priorityOrders = ordersSorted.filter(isPriority);
    let priorityWeight = priorityOrders.reduce(
      (sum, o) => sum + effectiveWeight(o),
      0
    );

    let clusterWeight = 0;

    // Initial centroid
    let centroid = { lat: warehouse.lat, lng: warehouse.lng };

    // Cluster loop
    for (const currentOrder of ordersSorted) {
      if (!unprocessed.has(currentOrder.order_id)) continue;

      // const w = currentOrder.weight_kg ?? 0;
      // const isUrgent = currentOrder.type === OrderType.URGENT;
      const w = effectiveWeight(currentOrder);
      const isPriorityOrder = isPriority(currentOrder);

      if (isPriorityOrder) {
        const pos = findBestInsertPosition(warehouse, cluster, currentOrder);
        cluster.splice(pos?.pos!, 0, currentOrder);

        priorityWeight -= w;
        clusterWeight += w;

        unprocessed.delete(currentOrder.order_id);

        if (clusterWeight > MAX_WEIGHT) {
          const result = trimClusterToFitWeight(cluster, "priority");
          cluster = result.cluster;
          clusterWeight = grossWeight(cluster);
          remainingOrders.push(...result.removedOrders);
        }

        centroid = clusterCentroid(cluster);
        continue;
      }

      //Normal Case
      const weightMargin = MAX_WEIGHT - (clusterWeight + priorityWeight);

      if (w > weightMargin) continue;

      const d = haversineKm(
        centroid.lat,
        centroid.lng,
        currentOrder.location.lat,
        currentOrder.location.lng
      );
      if (cluster.length > 1 && d > CLOSE_TO_DISTANCE_KM * 1.1) continue;

      const pos = findBestInsertPosition(warehouse, cluster, currentOrder);
      const insertPos = pos?.pos ?? cluster.length;

      const newRoute = cluster
        .slice(0, insertPos)
        .concat([currentOrder], cluster.slice(insertPos));
      const projectedTime = approxSecForRoute(warehouse, newRoute);

      // Time-window logic:
      // - Accept if within 1-day allowance (with slack)
      // - Else accept if allow2DaysTour and within 2-day max
      // - Else reject
      const fitsOneDay = projectedTime <= TIMEALLOWED_MIN_1DAY;
      const fitsTwoDay =
        allow2DaysTour &&
        projectedTime > TIMEALLOWED_MIN_1DAY &&
        projectedTime <= TIMEALLOWED_MAX_2DAY;

      if (!fitsOneDay && !fitsTwoDay) continue;

      cluster.splice(insertPos, 0, currentOrder);
      clusterWeight += w;
      unprocessed.delete(currentOrder.order_id);

      centroid = clusterCentroid(cluster);
    }

    // Trim normal orders if overweight
    if (clusterWeight > MAX_WEIGHT) {
      const result = trimClusterToFitWeight(cluster, "normal");
      cluster = result.cluster;
      remainingOrders.push(...result.removedOrders);
      clusterWeight = grossWeight(cluster);
    }

    // Remaining orders
    for (const o of ordersSorted) {
      if (unprocessed.has(o.order_id)) remainingOrders.push(o);
    }

    return { cluster, remainingOrders };
  }

  function splitOrdersIntoClustersSegmented(
    orders: Order[],
    options?: { allow2DaysTour?: boolean }
  ): { cluster: Order[]; remainingOrders: Order[] } {
    if (!orders.length) return { cluster: [], remainingOrders: [] };
    const allow2DaysTour = options?.allow2DaysTour ?? true;

    const ordersSorted = sortByWarehouse(warehouse, orders);

    const remaining = new Set(ordersSorted.map((o) => o.order_id));
    const ordersById = new Map(ordersSorted.map((o) => [o.order_id, o]));

    const cluster: Order[] = [];
    let priorityWeight = 0;
    let normalWeight = 0;

    // Phase 1: Priority/Urgent orders (single pass)
    for (const ord of ordersSorted) {
      if (!remaining.has(ord.order_id) || !isPriority(ord)) continue;

      const pos = findBestInsertPosition(warehouse, cluster, ord);
      const insertPos = pos?.pos ?? cluster.length;
      const tentative = [
        ...cluster.slice(0, insertPos),
        ord,
        ...cluster.slice(insertPos),
      ];
      // const tentative = [...cluster, ord];
      const sec = approxSecForRoute(warehouse, tentative);

      if (
        sec <= TIMEALLOWED_MIN_1DAY ||
        (allow2DaysTour && sec <= TIMEALLOWED_MAX_2DAY)
      ) {
        cluster.splice(insertPos, 0, ord);
        // urgentWeight += ord.weight_kg ?? 0;
        priorityWeight += effectiveWeight(ord);
        remaining.delete(ord.order_id);
      }
    }

    // Phase 2: Normal orders (iterative, bounded)
    let progress = true;

    while (progress) {
      progress = false;
      const centroid = clusterCentroid(cluster);

      for (const orderId of [...remaining]) {
        const ord = ordersById.get(orderId)!;

        // if (ord.type !== OrderType.NORMAL) continue;
        if (isPriority(ord)) continue;

        const weightMargin = MAX_WEIGHT - priorityWeight - normalWeight;

        const w = ord.weight_kg ?? 0;
        if (w > weightMargin) continue;

        const d = haversineKm(
          centroid.lat,
          centroid.lng,
          ord.location.lat,
          ord.location.lng
        );
        if (d > CLOSE_TO_DISTANCE_KM * 1.1) continue;

        const pos = findBestInsertPosition(warehouse, cluster, ord);
        const insertPos = pos?.pos ?? cluster.length;
        const tentative = [
          ...cluster.slice(0, insertPos),
          ord,
          ...cluster.slice(insertPos),
        ];
        // const tentative = [...cluster, ord];
        const sec = approxSecForRoute(warehouse, tentative);

        if (
          sec <= TIMEALLOWED_MIN_1DAY ||
          (allow2DaysTour && sec <= TIMEALLOWED_MAX_2DAY)
        ) {
          cluster.splice(insertPos, 0, ord);
          // cluster.push(ord);
          normalWeight += w;
          remaining.delete(orderId);
          progress = true;
        }
      }
    }

    // Remaining orders preserved for next cluster
    const remainingOrders = ordersSorted.filter((o) =>
      remaining.has(o.order_id)
    );
    return { cluster, remainingOrders };
  }

  // For non-priority orders
  function splitOrdersIntoClustersDynamic(
    orders: Order[],
    options: {
      proximityLimitKm: number;
      handleUrgent?: boolean;
      minWeight?: number;
      forceFlag?: boolean;
    }
  ): {
    clusters: Order[][];
    remainingOrders: Order[];
  } {
    const proximityLimitKm = options.proximityLimitKm ?? CLOSE_TO_DISTANCE_KM;
    const handleUrgent = options.handleUrgent ?? false;
    const minWeight = options.minWeight ?? MIN_WEIGHT;
    const forceFlag = options.forceFlag ?? false;

    const remainingOrders: Order[] = [];
    const clusters: Order[][] = [];
    const smallClusters: Order[][] = [];

    const orderMap = new Map<number, Order>();
    const unprocessedIds = new Set<number>();
    const urgentOrders = new Set<number>();

    orders.forEach((order) => {
      if (handleUrgent && order.type === OrderType.URGENT) {
        urgentOrders.add(order.order_id);
      }

      orderMap.set(order.order_id, order);
      unprocessedIds.add(order.order_id);

      if (order.weight_kg! >= minWeight) {
        clusters.push([order]);
        unprocessedIds.delete(order.order_id);
      }
    });

    while (unprocessedIds.size > 0) {
      const seedId = unprocessedIds.values().next().value!;
      const seed = orderMap.get(seedId)!;

      const cluster: Order[] = [seed];
      let clusterWeight = seed.weight_kg!;
      unprocessedIds.delete(seedId);

      let centroidLat = seed.location.lat;
      let centroidLng = seed.location.lng;

      let added = true;
      while (added) {
        added = false;
        let closestId: number | null = null;
        let closestDistance = Infinity;

        for (const id of unprocessedIds) {
          const order = orderMap.get(id)!;
          const d = haversineKm(
            centroidLat,
            centroidLng,
            order.location.lat,
            order.location.lng
          );

          const isUrgent = handleUrgent && urgentOrders.has(id);
          const proximityConstraint = isUrgent
            ? proximityLimitKm * 2
            : proximityLimitKm;

          if (
            clusterWeight + order.weight_kg! <= MAX_WEIGHT &&
            d <= proximityConstraint
          ) {
            const weightedDistance = isUrgent ? d * 0.9 : d;
            if (weightedDistance < closestDistance) {
              closestDistance = weightedDistance;
              closestId = id;
            }
          }
        }

        if (closestId !== null) {
          const nextOrder = orderMap.get(closestId)!;
          cluster.push(nextOrder);
          clusterWeight += nextOrder.weight_kg!;
          unprocessedIds.delete(closestId);

          const { lat, lng } = clusterCentroid(cluster);
          centroidLat = lat;
          centroidLng = lng;

          added = true;
        }
      }

      if (clusterWeight >= minWeight || forceFlag) {
        clusters.push(cluster);
      } else if (clusterWeight >= minWeight * 0.15) {
        console.log("Accepting weight below 15% of Min_Weight threshold");
        clusters.push(cluster);
      } else {
        smallClusters.push(cluster);

        logger.warn(
          `[Cluster Dynamic] small cluster size and weight: ${
            cluster.length
          } ${grossWeight(cluster)} Kg`
        );

        // remainingOrders.push(...cluster);
      }
    }

    if (!forceFlag) {
      for (let i = 0; i < smallClusters.length; i++) {
        for (let j = i + 1; j < smallClusters.length; j++) {
          const a = smallClusters[i];
          const b = smallClusters[j];
          const d = haversineKm(
            a[a.length - 1].location.lat,
            a[a.length - 1].location.lng,
            b[0].location.lat,
            b[0].location.lng
          );
          if (
            d <= proximityLimitKm * 1.25 &&
            grossWeight(a.concat(b)) >= minWeight
          ) {
            const merged = a.concat(b);
            if (grossWeight(merged) <= MAX_WEIGHT) {
              clusters.push(merged);
              smallClusters.splice(j, 1);
              smallClusters.splice(i, 1);
              i--;
              break;
            } else {
              while (merged.length > 0) {
                merged.pop();
                if (grossWeight(merged) <= MAX_WEIGHT) {
                  clusters.push(merged);
                  smallClusters.splice(j, 1);
                  smallClusters.splice(i, 1);
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (forceFlag && smallClusters.length > 0) {
      grossWeight(smallClusters.flat()) && clusters.push(...smallClusters);
    } else {
      smallClusters.forEach((c) => remainingOrders.push(...c));
    }

    return { clusters, remainingOrders };
  }

  function processDensSpatialClusters(satisfiedSectors: Order[][]): {
    clusters: { cluster: Order[]; tier: 1 | 2 | 3 }[];
    leftovers: Order[];
  } {
    // satisfiedSectors
    //  > pre-sorted by order density and each sector is sorted by distance form WH.
    // pendingSectors
    //  >  sorted by urgent order count (descending) in each sector.
    const pendingSectors = [...satisfiedSectors].sort((a, b) => {
      const priorityCountA = a.filter(
        (o) => o.type === OrderType.URGENT || o.type === OrderType.PICKUP
      ).length;
      const priorityCountB = b.filter(
        (o) => o.type === OrderType.URGENT || o.type === OrderType.PICKUP
      ).length;
      return priorityCountB - priorityCountA;
    });

    const geoClusters: { cluster: Order[]; tier: 1 | 2 | 3 }[] = [];
    const leftovers: Order[] = [];

    // Creates cluster from each sector around WH.
    // while (pendingSectors.length > 0) {

    const unsuccessfulSectors: Order[][] = [];

    // Creates cluster for each Vehicle in WH.
    while (geoClusters.length < Vehicle_Count && pendingSectors.length > 0) {
      if (pendingSectors.length === 0) break;

      logger.info(
        `[Process Cluster] Processing sectors left: ${pendingSectors.length}`
      );

      const currentSector = pendingSectors.shift()!;
      const remainingOrders: Order[] = [];
      const hasPriority = currentSector.some(
        (o) => o.type === OrderType.URGENT || o.type === OrderType.PICKUP
      );

      if (hasPriority) {
        // const { cluster: uCluster_Opt, remainingOrders: opt_rmn } =
        const opt = buildUrgentClusterOptimized(currentSector, {
          allow2DaysTour: true,
        });

        logger.info(
          `[Process Cluster] Urgent Optimized Cluster: ${grossWeight(
            opt.cluster
          )}, Remaining: ${
            opt.remainingOrders.length
          }, Time: ${approxSecForRoute(warehouse, opt.cluster)}.`
        );

        // const { cluster: uCluster_Seg, remainingOrders: seg_rmn } =
        const seg = splitOrdersIntoClustersSegmented(currentSector);

        logger.info(
          `[Process Cluster] Urgent Segmented Cluster: ${grossWeight(
            seg.cluster
          )}, Remaining: ${
            seg.remainingOrders.length
          }, Time: ${approxSecForRoute(warehouse, seg.cluster)}.`
        );

        const segScore = scoreCluster(warehouse, seg.cluster);
        const optScore = scoreCluster(warehouse, opt.cluster);

        logger.info(
          `[Process Cluster] Urgent Cluster Scores = Segmented: ${segScore}, Optimized: ${optScore}.`
        );

        const useOptimized =
          opt.cluster.length > 0 &&
          optScore >= segScore &&
          grossWeight(opt.cluster) <= MAX_WEIGHT;

        if (useOptimized) {
          geoClusters.push({ cluster: [...opt.cluster], tier: 2 });
          remainingOrders.push(...opt.remainingOrders);
        } else {
          geoClusters.push({ cluster: seg.cluster, tier: 2 });
          remainingOrders.push(...seg.remainingOrders);
        }
      } else {
        const { clusters, remainingOrders: rmn } =
          // Include time constraint
          splitOrdersIntoClustersDynamic(currentSector, {
            proximityLimitKm: CLOSE_TO_DISTANCE_KM * 1.6,
          });

        logger.info(`[Process Cluster] Created Normal Cluster: ${clusters}`);

        if (!clusters.length || clusters.length < 0) {
          unsuccessfulSectors.push(currentSector);
          continue;
        }

        if (clusters.length > 0)
          clusters.forEach((cls) => {
            geoClusters.push({ cluster: cls, tier: 1 });
          });
        remainingOrders.push(...unsuccessfulSectors.flat(), ...rmn);
      }

      // Second round,
      // -If created cluster is below MIN_WEIGHT,
      // -Try to fit created cluster with nearby sectors.
      if (geoClusters.length > 0) {
        let lastCluster = geoClusters.at(-1)!;
        const tWeight = grossWeight(lastCluster.cluster);
        const travelDuration = approxSecForRoute(
          warehouse,
          lastCluster.cluster
        );
        if (
          tWeight < MIN_WEIGHT &&
          travelDuration < TIMEALLOWED_MIN_1DAY &&
          pendingSectors.length > 0
        ) {
          const { cluster: dynCluster, remainingOrders: dynRemaining } =
            findNearbyClustersToFitWeightExtended(
              lastCluster.cluster,
              pendingSectors,
              hasPriority
            );
          const w00 = grossWeight(dynCluster);
          const t00 = approxSecForRoute(warehouse, dynCluster) / 3600;
          console.log(
            `Dynamic: ${dynCluster.length} Weight: ${w00}, Time: ${t00} hrs, Remaining: ${dynRemaining.length}`
          );

          const { cluster: sptCluster, remainingOrders: sptRemaining } =
            findNearbyClustersToFitWeight(
              lastCluster.cluster,
              pendingSectors,
              hasPriority
            );

          const w11 = grossWeight(sptCluster);
          const t11 = approxSecForRoute(warehouse, sptCluster) / 3600;
          console.log(
            `Spatial: ${sptCluster.length} Weight: ${w11}, Time: ${t11} hrs, Remaining: ${sptRemaining.length}`
          );

          const dynamicScore = scoreCluster(warehouse, dynCluster);
          const spatialScore = scoreCluster(warehouse, sptCluster);

          const useDynamic = dynamicScore >= spatialScore;

          const finalCluster = useDynamic ? dynCluster : sptCluster;
          const finalRemaining = useDynamic ? dynRemaining : sptRemaining;

          geoClusters.pop();
          geoClusters.push({
            cluster: finalCluster,
            tier: hasPriority ? 2 : 1,
          });

          // remainingOrders = remainingOrders.filter((o) => remainings.includes(o));
          remainingOrders.splice(0, remainingOrders.length, ...finalRemaining);
          // ...remainingOrders.filter((o) => remainings.includes(o))
        }
      }

      // Finally
      leftovers.push(...remainingOrders);
    }

    leftovers.push(...unsuccessfulSectors.flat());
    return {
      clusters: geoClusters,
      leftovers,
    };
  }

  function clusterOrdersByDensDirection(orders: Order[]): {
    geoClusters: { cluster: Order[]; tier: 1 | 2 | 3 }[];
    leftovers: Order[];
  } {
    orders.forEach((o) => ordersById.set(o.order_id, { ...o }));

    const NEARBY_RADIUS_KM = CLOSE_TO_DISTANCE_KM;
    const SECTOR_ANGLE_DEG = 90;
    const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;

    if (!orders.length) return { geoClusters: [], leftovers: [] };

    // const geoClusters: Order[][] = [];
    const geoClusters: {
      cluster: Order[];
      tier: 1 | 2 | 3;
    }[] = [];

    // --- Phase 1: Nearby zone ---
    const nearby: (Order & { distance?: number; angle?: number })[] = [];

    orders.forEach((o) => {
      const d = haversineKm(
        warehouse.lat,
        warehouse.lng,
        o.location.lat,
        o.location.lng
      );

      if (d > NEARBY_RADIUS_KM) return;

      const oo = ordersById.get(o.order_id)!;
      ordersById.set(o.order_id, {
        ...oo,
        distance: d,
        angle: 0,
      });

      nearby.push(oo);
    });

    const nearbyOrders_weight = grossWeight(nearby);

    nearby.sort((a, b) => a.distance! - b.distance!);

    if (nearby.length && nearbyOrders_weight >= MIN_WEIGHT) {
      if (nearbyOrders_weight > MAX_WEIGHT) {
        const result = splitOrdersIntoClustersDynamic(nearby, {
          proximityLimitKm: NEARBY_RADIUS_KM,
        });
        if (result.clusters.length)
          result.clusters.map((cluster) =>
            geoClusters.push({ cluster, tier: 1 })
          );

        if (result.remainingOrders.length) {
          nearby.splice(0);
          nearby.push(...result.remainingOrders);
        }
      } else {
        // Single valid cluster within limits
        // geoClusters.push([...nearby]);
        geoClusters.push({
          cluster: nearby.map(({ distance, angle, ...rest }) => rest),
          tier: 1,
        });

        logger.info(`[Nearby Zone] Orders captured: ${nearby.length}`);
        nearby.splice(0);
      }
    }

    let remainingOrders = [...orders];
    // const remainingOrders = orders.filter((o) => !nearbyIds.has(o.order_id));
    // if (!remainingOrders.length) return geoClusters;

    if (geoClusters.length > 0) {
      const geoClustersOrderIds = new Set(
        geoClusters.flatMap((c) => c.cluster).map((o) => o.order_id)
      );
      remainingOrders = remainingOrders.filter(
        (prev) => !geoClustersOrderIds.has(prev.order_id)
      );
    }

    // --- Phase 2: Sectors ---
    const sectors = new Map<number, (Order & { angle: number })[]>();
    for (const o of remainingOrders) {
      const dx = o.location.lng! - warehouse.lng!;
      const dy = o.location.lat! - warehouse.lat!;
      const angle = Math.atan2(dy, dx);
      let normalized = angle + Math.PI;
      // ensure normalized in [0, 2PI)
      // if (normalized < 0) normalized += 2 * Math.PI;
      // if (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;
      const sectorId = Math.floor(normalized / SECTOR_ANGLE_RAD);
      const distance = haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        o.location.lat!,
        o.location.lng!
      );
      o.distance = distance;
      if (!sectors.has(sectorId)) sectors.set(sectorId, []);
      sectors.get(sectorId)!.push({ ...o, distance, angle });
    }
    // --- Phase 3: Sort sectors by density ---
    const sortedSectors = Array.from(sectors.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([id, orders]) => {
        logger.info(`[Sector] ID: ${id}, Orders: ${orders.length}`);
        return orders;
      });

    sortedSectors.forEach((sector) =>
      sector.sort((a, b) => a.distance! - b.distance!)
    );

    const satisfiedSectors: Order[][] = [];

    satisfiedSectors.push(...sortedSectors);

    // --- Phase 4: Radial clustering within sector ---
    const { clusters, leftovers } =
      processDensSpatialClusters(satisfiedSectors);

    logger.info(
      `Warehoue ${warehouse.id}:${warehouse.town} has ${clusters.length} Clusters for ${orders.length} Orders.`
    );
    if (clusters.length) {
      logger.info(
        `Clusters Weight: ${clusters
          .map((c) => grossWeight(c.cluster))
          .join(", ")}`
      );
    }

    clusters.forEach((c) => {
      // geoClusters.push({cluster: c.cluster, tier: c.tier});
      logger.info(
        `[Process Cluster]: [Created Cluster] Size: ${
          c.cluster.length
        } & weight:  
        ${grossWeight(c.cluster)}`
      );
    });

    logger.info(
      `Leftover Orders (${leftovers.length}): ${leftovers
        .map((o) => o.order_id)
        .join(", ")}`
    );

    geoClusters.push(...clusters);

    return { geoClusters, leftovers };
  }

  return {
    MIN_WEIGHT,
    MAX_WEIGHT,
    clusterOrdersByDensDirection,
    // trimClusterToFitTimeWindow,
  };
}

// const simpleCache = new Map<string, any>();
// async function cacheGet<T>(k: string): Promise<T | undefined> {
//   return simpleCache.get(k);
// }
// async function cacheSet(k: string, v: any, ttl = 6 * 60000) {
//   simpleCache.set(k, v);
//   setTimeout(() => {
//     simpleCache.delete(k);
//     console.log(`Cache expired for key: ${k}`);
//   }, ttl);
// }
// async function cacheDel(k: string) {
//   if (simpleCache.has(k)) {
//     simpleCache.delete(k);
//     console.log(`Cache deleted for key: ${k}`);
//   }
// }
// async function flushCache() {
//   simpleCache.clear();
//   console.warn("Cache flushed");
// }

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
      // flushCache();
    }
  }
  return { enter, leave };
}
export const matrixSemaphore = semaphore(MATRIX_CONCURRENCY);
