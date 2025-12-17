import { Order, OrderType } from "../../types/order.types";
import { Warehouse } from "../../types/warehouse.types";
import { haversineKm } from "./haversineKm";
import { grossWeight } from "./ordersNetWeight";

export function approxSecForRoute(
  warehouse: { lat: number; lng: number },
  orderes: Order[],
  AVERAGE_SPEED_KMPH: number = 100,
  SERVICE_TIME_PER_STOP_MIN: number = 5
): number {
  if (!orderes.length) return 0;
  let totalKm = 0;
  // warehouse -> first
  totalKm += haversineKm(
    warehouse.lat!,
    warehouse.lng!,
    orderes[0].location.lat!,
    orderes[0].location.lng!
  );
  // consecutive legs
  for (let i = 1; i < orderes.length; i++) {
    totalKm += haversineKm(
      orderes[i - 1].location.lat!,
      orderes[i - 1].location.lng!,
      orderes[i].location.lat!,
      orderes[i].location.lng!
    );
  }
  // return leg
  totalKm += haversineKm(
    orderes[orderes.length - 1].location.lat!,
    orderes[orderes.length - 1].location.lng!,
    warehouse.lat!,
    warehouse.lng!
  );

  // approximate travel time + service time
  const travelSec = (totalKm / AVERAGE_SPEED_KMPH) * 3600;
  const serviceSec = orderes.length * SERVICE_TIME_PER_STOP_MIN * 60;
  return travelSec + serviceSec;
}

export function approxKmForRoute(
  warehouse: { lat: number; lng: number },
  orders: Order[]
): number {
  if (!orders.length) return 0;

  let totalKm = 0;

  // warehouse -> first
  totalKm += haversineKm(
    warehouse.lat,
    warehouse.lng,
    orders[0].location.lat,
    orders[0].location.lng
  );

  // consecutive legs
  for (let i = 1; i < orders.length; i++) {
    totalKm += haversineKm(
      orders[i - 1].location.lat,
      orders[i - 1].location.lng,
      orders[i].location.lat,
      orders[i].location.lng
    );
  }

  // return leg
  totalKm += haversineKm(
    orders[orders.length - 1].location.lat,
    orders[orders.length - 1].location.lng,
    warehouse.lat,
    warehouse.lng
  );

  return totalKm;
}

export function splitIntoSegmentsByUrgent(orders: Order[]) {
  const segments: Order[][] = [];
  let current: Order[] = [];

  for (const o of orders) {
    current.push(o);
    if (o.type === OrderType.URGENT) {
      segments.push(current);
      current = [];
    }
  }
  // tail after last urgent (no trailing urgent) - treat as trailing segment that has no urgent.
  if (current.length > 0) {
    // append to last segment if exists (makes sense: trailing normals after last urgent)
    if (segments.length === 0) segments.push(current);
    else
      segments[segments.length - 1] =
        segments[segments.length - 1].concat(current);
  }

  return segments;
}

export function insertOrderIfFeasible(
  warehouse: Warehouse,
  cluster: Order[],
  order: Order,
  maxWeight: number,
  timeLimitSec: number
): { success: boolean; newCluster: Order[]; newWeight: number } {
  if (grossWeight(cluster) + (order.weight_kg ?? 0) > maxWeight)
    return {
      success: false,
      newCluster: cluster,
      newWeight: grossWeight(cluster),
    };

  const pos = findBestInsertPosition(warehouse, cluster, order);
  let candidate: Order[];
  if (!pos) candidate = [...cluster, order];
  else
    candidate = [
      ...cluster.slice(0, pos.pos),
      order,
      ...cluster.slice(pos.pos),
    ];

  const t = approxSecForRoute(warehouse, candidate);
  if (t > timeLimitSec)
    return {
      success: false,
      newCluster: cluster,
      newWeight: grossWeight(cluster),
    };

  return {
    success: true,
    newCluster: candidate,
    newWeight: grossWeight(candidate),
  };
}

// evaluate whether including a prefix of normals (before urgent) is feasible
export function evaluateSegmentInclusion(
  warehouse: Warehouse,
  baseCluster: Order[],
  prefixNormals: Order[],
  urgentOrder: Order,
  options: {
    proximityLimitKm: number;
    maxWeight: number;
    timeLimitSec: number;
  }
) {
  // Consider three possible combinations:
  // - skipNormals: only urgent (no prefix)
  // - includeAll: prefixNormals + urgent
  // - includePrefixGreedy: longest prefix that does not break MAX_WEIGHT or TIME_LIMIT

  const skipCluster = [...baseCluster, urgentOrder];
  const skipWeight = grossWeight(skipCluster);
  const skipTime = approxSecForRoute(warehouse, skipCluster);

  const includeAllCluster = [...baseCluster, ...prefixNormals, urgentOrder];
  const includeAllWeight = grossWeight(includeAllCluster);
  const includeAllTime = approxSecForRoute(warehouse, includeAllCluster);

  // Greedy prefix
  let greedyCluster = [...baseCluster];
  let greedyWeight = grossWeight(greedyCluster);
  for (const n of prefixNormals) {
    if (greedyWeight + (n.weight_kg ?? 0) > options.maxWeight) break;
    const candidateCluster = [...greedyCluster, n, urgentOrder];
    const t = approxSecForRoute(warehouse, candidateCluster);
    if (t > options.timeLimitSec) break;
    greedyCluster.push(n);
    greedyWeight += n.weight_kg ?? 0;
  }

  if (!greedyCluster.some((o) => o.order_id === urgentOrder.order_id))
    greedyCluster.push(urgentOrder);

  const greedyWeightFinal = grossWeight(greedyCluster);
  const greedyTime = approxSecForRoute(warehouse, greedyCluster);

  // Choose best candidate by priority:
  // 1) includeAll if fits (max normals + urgent)
  // 2) greedy prefix
  // 3) skip
  const fitsIncludeAll =
    includeAllWeight <= options.maxWeight &&
    includeAllTime <= options.timeLimitSec;
  const fitsGreedy =
    greedyWeightFinal <= options.maxWeight &&
    greedyTime <= options.timeLimitSec;
  const fitsSkip =
    skipWeight <= options.maxWeight && skipTime <= options.timeLimitSec;

  type Candidate = {
    cluster: Order[];
    weight: number;
    time: number;
    name: string;
  };
  const candidates: Candidate[] = [];
  if (fitsIncludeAll)
    candidates.push({
      cluster: includeAllCluster,
      weight: includeAllWeight,
      time: includeAllTime,
      name: "includeAll",
    });
  if (fitsGreedy)
    candidates.push({
      cluster: greedyCluster,
      weight: greedyWeightFinal,
      time: greedyTime,
      name: "greedy",
    });
  if (fitsSkip)
    candidates.push({
      cluster: skipCluster,
      weight: skipWeight,
      time: skipTime,
      name: "skip",
    });

  if (candidates.length === 0) {
    return {
      chosen: skipCluster,
      chosenName: "skipFallback",
      chosenWeight: skipWeight,
      chosenTime: skipTime,
      fitsAny: false,
    };
  }

  // Rank candidates: prefer one that includes urgent + more orders, then shorter time
  candidates.sort((a, b) => {
    // prefer larger cluster length (more orders)
    if (b.cluster.length !== a.cluster.length)
      return b.cluster.length - a.cluster.length;
    return a.time - b.time; // prefer lower time
  });

  const best = candidates[0];
  return {
    chosen: best.cluster,
    chosenName: best.name,
    chosenWeight: best.weight,
    chosenTime: best.time,
    fitsAny: true,
  };
}

// compute time impact of removing a given normal order from cluster
export function timeImpactRemovingOrder(
  warehouse: { lat: number; lng: number },
  cluster: Order[],
  orderToRemove: Order
) {
  const before = approxSecForRoute(warehouse, cluster);
  const after = approxSecForRoute(
    warehouse,
    cluster.filter((o) => o.order_id !== orderToRemove.order_id)
  );
  return before - after; // positive if removing saves time
}

export function findBestInsertPosition(
  warehouse: { lat: number; lng: number },
  cluster: Order[],
  candidate: Order
): { pos: number; addedKm: number } | null {
  // evaluate inserting before position i
  // (0 => before first, cluster.length => after last)
  let bestPos: number | null = null;
  let bestAdded = Infinity;

  // helper to compute route km for small sequences
  const kmForSequence = (seq: Order[]) => {
    if (!seq.length) return 0;
    let km = 0;
    km += haversineKm(
      warehouse.lat,
      warehouse.lng,
      seq[0].location.lat,
      seq[0].location.lng
    );
    for (let i = 1; i < seq.length; i++) {
      km += haversineKm(
        seq[i - 1].location.lat,
        seq[i - 1].location.lng,
        seq[i].location.lat,
        seq[i].location.lng
      );
    }
    km += haversineKm(
      seq[seq.length - 1].location.lat,
      seq[seq.length - 1].location.lng,
      warehouse.lat,
      warehouse.lng
    );
    return km;
  };

  for (let pos = 0; pos <= cluster.length; pos++) {
    const newSeq = [...cluster.slice(0, pos), candidate, ...cluster.slice(pos)];
    const addedKm = kmForSequence(newSeq) - kmForSequence(cluster);
    if (addedKm < bestAdded) {
      bestAdded = addedKm;
      bestPos = pos;
    }
  }

  if (bestPos === null) return null;
  return { pos: bestPos, addedKm: bestAdded };
}

export function buildSectors(orders: Order[], warehouse: Warehouse) {
  // const sectorCount = computeSectorCount(orders.length);
  const sectorCount = 25;
  const sectorAngleRad = (2 * Math.PI) / sectorCount;

  // const SECTOR_ANGLE_DEG = 180;
  // const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;

  const sectors: Array<(Order & { distance: number; angle: number })[]> =
    Array.from({ length: sectorCount }, () => []);

  for (const o of orders) {
    const dx = o.location.lng - warehouse.lng;
    const dy = o.location.lat - warehouse.lat;
    const angle = Math.atan2(dy, dx);
    let normalized = angle + Math.PI;
    // ensure normalized in [0, 2PI)
    if (normalized < 0) normalized += 2 * Math.PI;
    if (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;
    const sectorId = Math.floor(normalized / sectorAngleRad);

    const distance = haversineKm(
      warehouse.lat,
      warehouse.lng,
      o.location.lat,
      o.location.lng
    );
    sectors[sectorId].push({ ...o, distance, angle });
  }

  const nonEmptySectors = sectors
    .map((s) => s.sort((a, b) => a.distance - b.distance))
    .filter((s) => s.length > 0);

  nonEmptySectors.sort((a, b) => b.length - a.length);
  return nonEmptySectors;
}

export function scoreCluster(warehouse: Warehouse, cluster: Order[]): number {
  const weight = grossWeight(cluster);
  const timeHours = approxSecForRoute(warehouse, cluster) / 3600;
  const timePenaltyFactor = Math.max(10, 50 - weight / 50);
  const score = weight - timeHours * timePenaltyFactor;
  return score;
}

// assignmentworker.helper

  // function processTier2UrgentOrders(allUrgentOrders: Order[]): {
  //   clusters: { cluster: Order[]; tier: 2 }[];
  //   leftovers: Order[];
  // } {
  //   const tier2Clusters: { cluster: Order[]; tier: 2 }[] = [];
  //   const leftovers: Order[] = [];

  //   logger.info(
  //     `[Tier 2] Processing for Urgent orders: ${allUrgentOrders.length}`
  //   );

  //   const totalWeight = grossWeight(allUrgentOrders);
  //   const avgWeight = totalWeight / allUrgentOrders.length;
  //   const MIN_WEIGHT_URGENT = Math.min(MIN_WEIGHT, avgWeight * 0.8);

  //   const { clusters, remainingOrders } = splitOrdersIntoClustersDynamic(
  //     allUrgentOrders,
  //     {
  //       proximityLimitKm: CLOSE_TO_DISTANCE_KM * 1.6,
  //       minWeight: MIN_WEIGHT_URGENT,
  //       handleUrgent: true,
  //     }
  //   );

  //   clusters.forEach((c) => {
  //     tier2Clusters.push({ cluster: c, tier: 2 });
  //   });

  //   leftovers.push(...remainingOrders);

  //   return { clusters: tier2Clusters, leftovers };
  // }

// ***************************

// async function trimClusterToFitTimeWindow(
//   cluster: Order[],
//   options?: Partial<{
//     MIN_WEIGHT: number;
//     isMultiDay: boolean;
//     tier: number;
//   }>
//   // TIME_WINDOW_HOURS: number;
// ): Promise<{ fitted: Order[]; trimmed: Order[] }> {
//   const isMultiDay = options?.isMultiDay ?? false;

//   // const MIN_Wt = overrides?.MIN_WEIGHT ?? MIN_WEIGHT;
//   const isUrgent = options?.tier && options.tier > 1;
//   const MIN_Wt = isUrgent ? MIN_WEIGHT_URGENT : MIN_WEIGHT;

//   // const tier = overrides.tier ?? 1;

//   // 750 km --- 1200 km
//   // isMultiDay => access on runtime if its more efficient to take it to 2 days
//   // then need to adjust the Distance Meters acc.

//   // const MAX_TOUR_DISTANCE_METERS = 750 * 1000;
//   // const DISTANCE_TOLERANCE_PERCENT = 0.2; // 20%
//   // const allowedDistance =
//   //   MAX_TOUR_DISTANCE_METERS * (1 + DISTANCE_TOLERANCE_PERCENT);

//   const TIME_LIMIT = isMultiDay ? TIME_WINDOW_HOURS * 1.8 : TIME_WINDOW_HOURS;
//   const TIME_TOLERANCE_PERCENT = 0.05; // 5%
//   const allowedTime = TIME_LIMIT * 3600 * (1 + TIME_TOLERANCE_PERCENT);

//   const trimmed: Order[] = [];

//   const clusterWeight = grossWeight(cluster);
//   if (!cluster.length || clusterWeight < MIN_Wt)
//     return { fitted: [], trimmed: [] };

//   // cache key
//   // const clusterKey = `matrix:${warehouse.id}:${cluster
//   //   .map((o) => o.order_id)
//   //   .join(",")}`;

//   // concurrency control
//   await matrixSemaphore.enter();
//   try {
//     const approxSec = approxSecForRoute(cluster);
//     if (approxSec <= allowedTime) return { fitted: cluster, trimmed: [] };

//     let fitted = cluster;
//     while (grossWeight(fitted) >= MIN_Wt) {
//       trimmed.push(fitted.pop()!);
//       const approxNow = approxSecForRoute(fitted);
//       if (approxNow <= allowedTime)
//         return {
//           fitted,
//           trimmed: trimmed.concat(cluster.filter((o) => !fitted.includes(o))),
//         };
//     }

//     return { fitted: [], trimmed: trimmed.concat(fitted) };

//     // caching
//     // let matrix = await cacheGet<MatrixData | undefined>(clusterKey);
//     // Cluster and Matrix Map
//     // const clusterIndexMap = new Map<number, number>();
//     // if (!matrix) {
//     //   matrix = await getEndpointsRouteMatrix(warehouse, cluster);
//     //   matrix = await getEndpointsRouteMatrix(warehouse, cluster);
//     //   if (matrix && (!matrix.errorCodes || matrix.errorCodes.length === 0)) {
//     //     cluster.forEach((order, idx) => {
//     //       clusterIndexMap.set(order.order_id, idx);
//     //     });
//     //     await cacheSet(clusterKey, matrix);
//     //   } else {
//     //     matrix = undefined;
//     //     logger.warn("Matrix Empty, no response from Here API");
//     //   }
//     // }

//     // // matrix exists, compute duration sec
//     // const durationSec = metrixHelper.computeTourDurationUsingMatrix(
//     //   matrix!,
//     //   cluster,
//     //   clusterIndexMap
//     // );
//     // // compute distance meters
//     // const distanceMeters = metrixHelper.computeTourDistanceUsingMatrix(
//     //   matrix!,
//     //   cluster,
//     //   clusterIndexMap
//     // );
//     // logger.info(`durationSec: ${durationSec}`);
//     // logger.info(`distanceMeters: ${distanceMeters}`);
//     // logger.info(`allowedDistance Tolerance: ${allowedDistance}`);
//     // if (durationSec <= allowedTime && distanceMeters <= allowedDistance) {
//     //   logger.info("Round 1st: Cluster Accepted as is");
//     //   logger.info(
//     //     `Cluster Accepted: WH ${warehouse.id}-${warehouse.town}, ${
//     //       cluster.length
//     //     } Orders:
//     //    ${cluster.map((o) => o.order_id).join(",")} `
//     //   );
//     //   // cacheDel(clusterKey);
//     //   return { fitted: cluster, trimmed: [] };
//     // } else if (cluster.length <= 6 && durationSec <= allowedTime) {
//     //   while (cluster.length) {
//     //     // const atlastWeight = grossWeight([cluster.at(-1)!]);
//     //     const lastOrderWeight = cluster.at(-1)?.weight_kg!;
//     //     if (clusterWeight - lastOrderWeight < MIN_Wt)
//     //       return { fitted: cluster, trimmed: [] };
//     //     cluster.pop();
//     //   }
//     // }
//     // let fitted = cluster;
//     // while (grossWeight(fitted) >= MIN_Wt) {
//     //   trimmed.push(fitted.pop()!);
//     //   const dur_sec_2 = metrixHelper.computeTourDurationUsingMatrix(
//     //     matrix,
//     //     fitted,
//     //     clusterIndexMap
//     //   );
//     //   // const dis_mtr_2 = metrixHelper.computeTourDistanceUsingMatrix(
//     //   //   matrix,
//     //   //   fitted,
//     //   //   clusterIndexMap
//     //   // );
//     //   // logger.info(`dur_sec_2: ${dur_sec_2}`);
//     //   // logger.info(`dis_mtr_2: ${dis_mtr_2}`);
//     //   // && dis_mtr_2 <= allowedDistance
//     //   if (dur_sec_2 <= allowedTime) {
//     //     cacheDel(clusterKey);
//     //     return { fitted, trimmed };
//     //   } else {
//     //     continue;
//     //   }
//     // }
//     // return { fitted: [], trimmed: trimmed.concat(fitted) };
//   } finally {
//     matrixSemaphore.leave();
//   }
// }