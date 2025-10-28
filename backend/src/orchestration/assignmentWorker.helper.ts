import logger from "../config/logger";
import {
  getWarehouseLocationCords,
  getWarehouseZipcodesRecord,
} from "../services/warehouse.service";

import { Tour } from "../types/tour.types";
import { Order } from "../types/order.types";
import { Warehouse } from "../types/warehouse.types";
import { LogisticOrder } from "../model/LogisticOrders";

import { haversineKm } from "./utils/haversineKm";
import { clusterWeight, grossWeight } from "./utils/ordersNetWeight";
import {
  KDTree,
  Maybe,
  Point,
  popNearestOrderFromSet,
} from "./utils/searchTree";

const SECTOR_ANGLE_DEG = 180;
const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;
// const MATRIX_CONCURRENCY = 3; // Concurrent calls
// const MATRIX_RETRY = 2;
// const MATRIX_RETRY_DELAY_MS = 1000;

const MIN_ORDERS = 10;
const MAX_CLUSTER_SIZE = 15;
const CLOSE_TO_DISTANCE_KM = 40; // between consecutive orders
const TIME_WINDOW_HOURS = 10;
// const MAX_TOUR_DISTANCE_METERS = 600 * 1000; // 600 km -> meters
const SERVICE_TIME_PER_STOP_MIN = 5;
const AVERAGE_SPEED_KMPH = 100;

// const MIN_WEIGHT = warehouse.gross_weight_kg ?? 0;
const MIN_WEIGHT = 1250; // warehouse.gross_weight_kg!;
const MAX_WEIGHT = MIN_WEIGHT + 150;

export function secondsForApproxRoute(
  warehouse: Warehouse,
  orderes: Order[]
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

export function getTourDurationSecFromTour(tour: Tour): number | null {
  if (!tour) return null;

  const duration_sec = tour.stops?.reduce((acc, stop) => {
    const round =
      stop.time?.departure && stop.time?.arrival
        ? new Date(stop.time.departure).getTime() -
          new Date(stop.time.arrival).getTime()
        : 0;
    return acc + (round * 3600) / 1000;
  }, 0);

  return duration_sec || null;
}

export function trimClusterToFit(
  warehouse: Warehouse,
  orders: Order[]
): { fitted: Order[]; trimmed: Order[] } {
  const trimmed: Order[] = [];

  // Sort orders by distance from warehouse
  const fitted = [...orders].sort(
    (a, b) =>
      haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        a.location.lat!,
        a.location.lng!
      ) -
      haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        b.location.lat!,
        b.location.lng!
      )
  );

  while (fitted.length >= MIN_ORDERS) {
    const approxSec = secondsForApproxRoute(warehouse, fitted);

    //check Distance b/t sorted orders to trim the last
    // logWithTime(
    //   `Duration ${approxSec} is ${
    //     approxSec < TIME_WINDOW_HOURS * 3600 ? "lesser" : "greater"
    //   } than ${TIME_WINDOW_HOURS * 3600}`
    // );

    if (approxSec <= TIME_WINDOW_HOURS * 3600) break;

    // remove farthest order from warehouse (last in fitted/sorted array)
    trimmed.push(fitted.pop()!);
  }

  // If trimming dropped below MIN_ORDERS, move all fitted orders to trimmed:
  if (fitted.length < MIN_ORDERS) {
    trimmed.push(...fitted);
    return { fitted: [], trimmed };
  }

  return { fitted, trimmed };
}

// function computeSectorCount(orderCount: number) {
//   const targetPerSector = 12;
//   const minSectors = 6;
//   const maxSectors = 36;
//   const computed = Math.max(
//     minSectors,
//     Math.min(maxSectors, Math.ceil(orderCount / targetPerSector))
//   );
//   logger.debug(`Sector count chosen: ${computed} for ${orderCount} orders`);
//   return computed;
// }

function buildSectors(orders: Order[], warehouse: Warehouse) {
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

export function clusterOrdersProduction(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  if (!orders || orders.length === 0) return [];

  const NEARBY_RADIUS_KM = 50;

  // Phase 0: Precompute maps and KD tree for global lookups
  const ordersById = new Map<
    number,
    Order & { distance?: number; angle?: number }
  >();
  const points: Point[] = [];
  for (const o of orders) {
    ordersById.set(o.order_id, { ...o });
    points.push({ x: o.location.lng, y: o.location.lat, id: o.order_id });
  }
  const globalKD = new KDTree(points);
  console.log("Global KD Tree", globalKD);

  const nearby: (Order & { distance?: number; angle?: number })[] = [];
  for (const o of orders) {
    const d = haversineKm(
      warehouse.lat,
      warehouse.lng,
      o.location.lat,
      o.location.lng
    );
    if (d <= NEARBY_RADIUS_KM) {
      const oo = ordersById.get(o.order_id)!;
      oo.distance = d;
      oo.angle = 0;
      nearby.push(oo);
    }
  }

  const clusters: Order[][] = [];
  const usedOrderIds = new Set<number>();

  // If nearby zone weight crosses MIN_WEIGHT, make a cluster
  if (nearby.length) {
    const nearbyWeight = clusterWeight(nearby);
    if (nearbyWeight >= MIN_WEIGHT) {
      // clusters.push([...nearby]);
      clusters.push(nearby.map((x) => ({ ...x })));
      nearby.forEach((o) => usedOrderIds.add(o.order_id));
      logger.info(
        `[Nearby Zone] cluster created, orders=${
          nearby.length
        }, weight=${nearbyWeight.toFixed(1)}`
      );
    } else {
      // leave them for the normal flow (they are not removed)
      logger.debug(
        `[Nearby Zone] not enough weight (${nearbyWeight.toFixed(
          1
        )}) to form full cluster yet`
      );
    }
  }

  // Phase 2: Build dynamic sectors from remaining orders (exclude used)
  const remainingOrders = orders.filter((o) => !usedOrderIds.has(o.order_id));
  const sectors = buildSectors(remainingOrders, warehouse); // each sector: sorted by distance

  const pendingSectors: (Order & { distance: number; angle: number })[][] =
    sectors.map((s) => s.slice());

  // Build local KD trees per sector for faster nearest within sector (optional)
  // For simplicity we will build a global KD and a remainingSet for membership checks

  // remainingSet holds order ids not yet assigned
  const remainingSet = new Set<number>(remainingOrders.map((o) => o.order_id));
  // remove any used (nearby) if assigned earlier
  for (const id of usedOrderIds) remainingSet.delete(id);

  // Phase 3: Process sectors by density (already sorted top-down by buildSectors)
  while (pendingSectors.length > 0) {
    const sector = pendingSectors.shift()!;
    if (!sector || sector.length === 0) continue;

    // Build a local KDTree for this sector to speed nearest searches inside it
    const sectorPoints = sector.map((o) => ({
      x: o.location.lng,
      y: o.location.lat,
      id: o.order_id,
    }));
    const sectorKD = new KDTree(sectorPoints);

    // Build a set of remaining ids belonging to this sector
    const sectorRemaining = new Set<number>(sector.map((o) => o.order_id));

    // While this sector still has remaining orders, create clusters inside it
    while (sectorRemaining.size > 0) {
      // Start new cluster by picking nearest-to-warehouse (sector already sorted by distance)
      // Find first order in sector that is still in sectorRemaining
      let startOrder: Maybe<Order & { distance: number; angle: number }>;
      for (const o of sector) {
        if (sectorRemaining.has(o.order_id)) {
          startOrder = o;
          break;
        }
      }
      if (!startOrder) break;

      // Initialize cluster
      const cluster: Order[] = [];
      // consume it
      cluster.push({ ...startOrder });
      sectorRemaining.delete(startOrder.order_id);
      remainingSet.delete(startOrder.order_id);

      // Also remove from sector array (mutate)
      const idx = sector.findIndex((x) => x.order_id === startOrder!.order_id);
      if (idx >= 0) sector.splice(idx, 1);

      // Grow cluster within the sector using KD nearest candidates until MAX_WEIGHT
      while (clusterWeight(cluster) < MAX_WEIGHT && sectorRemaining.size > 0) {
        // Use sectorKD to find nearest candidate(s) to last item
        const last = cluster.at(-1)!;
        const candidate = popNearestOrderFromSet(
          last.location.lat,
          last.location.lng,
          sectorKD,
          sectorRemaining,
          ordersById
        );
        if (!candidate) break;
        // Add to cluster
        cluster.push({ ...candidate });
        remainingSet.delete(candidate.order_id);
        // Also remove candidate from sector mutable array
        const si = sector.findIndex((x) => x.order_id === candidate.order_id);
        if (si >= 0) sector.splice(si, 1);
      }

      // If cluster weight still < MIN_WEIGHT, try to pull from nearest other sectors
      if (clusterWeight(cluster) < MIN_WEIGHT) {
        // Attempt iterative merging from the remaining pending sectors
        let merged = false;
        // We'll search pendingSectors for closest sector-to-last-order
        // Compute last coords
        const last = cluster.at(-1)!;

        // Find nearest sector index
        let nearestIdx = -1;
        let nearestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < pendingSectors.length; i++) {
          const sec = pendingSectors[i];
          if (!sec || sec.length === 0) continue;
          const candidateFirst = sec[0]; // sector sorted by distance
          const d = haversineKm(
            last.location.lat!,
            last.location.lng!,
            candidateFirst.location.lat!,
            candidateFirst.location.lng!
          );
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        }

        if (nearestIdx >= 0) {
          // Take that sector out and try to pull some orders from it
          const nearestSector = pendingSectors.splice(nearestIdx, 1)[0];
          // Sort by distance (defensive)
          nearestSector.sort((a, b) => a.distance - b.distance);

          // consume items from nearestSector one-by-one (closest first) until cluster reaches MAX_WEIGHT or sector exhausted
          for (
            let i = 0;
            i < nearestSector.length && clusterWeight(cluster) < MAX_WEIGHT;

          ) {
            const o = nearestSector[i];
            // if this order already assigned elsewhere, skip
            if (!remainingSet.has(o.order_id)) {
              i++;
              continue;
            }
            // consume
            cluster.push({ ...o });
            remainingSet.delete(o.order_id);
            // also attempt removing from other structures (if it belonged to its own sector remaining set)
            // We cannot easily find that sectorRemaining here; however because we removed the whole nearestSector from pendingSectors,
            // we are operating on its local array 'nearestSector' and will reinsert leftover later if any.
            // Remove by index
            nearestSector.splice(i, 1);
          }

          // If nearestSector still has leftover orders, push it back into pendingSectors for future processing
          if (nearestSector.length > 0) {
            pendingSectors.push(nearestSector);
            logger.debug(
              `Nearest sector partially consumed; ${nearestSector.length} orders remain and were reinserted to pendingSectors`
            );
          } else {
            logger.debug("Nearest sector fully consumed in merging.");
          }

          merged = true;
        }

        // If could not merge (no other sectors), we will finalize cluster even if underweight (last resort)
        if (!merged && clusterWeight(cluster) < MIN_WEIGHT) {
          logger.warn(
            `Cluster under MIN_WEIGHT (${clusterWeight(cluster).toFixed(
              1
            )} < ${MIN_WEIGHT}). Finalizing leftover cluster.`
          );
          // We don't attempt further merging otherwise risk infinite loops
        }
      }

      // Finalize this cluster
      clusters.push(cluster);
      logger.info(
        `[Cluster Added] size=${cluster.length} weight=${clusterWeight(
          cluster
        ).toFixed(1)}`
      );
    } // end while sectorRemaining
  } // end while pendingSectors

  // After main loop: if any remainingSet ids still exist (rare), create final clusters (greedy)
  if (remainingSet.size > 0) {
    logger.warn(
      `Remaining ${remainingSet.size} orders unassigned after main pass; assigning greedily.`
    );
    const leftoverIds = Array.from(remainingSet);
    // simple greedy grouping by nearest to warehouse or as singletons
    for (const id of leftoverIds) {
      const o = ordersById.get(id)!;
      if (!o) continue;
      clusters.push([{ ...o }]);
      remainingSet.delete(id);
    }
  }

  logger.info(`Clustering complete. final clusters = ${clusters.length}`);
  return clusters;
}

const ordersById = new Map<
  number,
  Order & { distance?: number; angle?: number }
>();

export function clusterOrdersByDensDirection(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  const NEARBY_RADIUS_KM = 80;
  const SECTOR_ANGLE_DEG = 90;
  const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;

  if (!orders.length) return [];

  const geoClusters: Order[][] = [];

  for (const o of orders) {
    ordersById.set(o.order_id, { ...o });
  }

  // --- Phase 1: Nearby zone ---
  const nearby: (Order & { distance?: number; angle?: number })[] = [];
  for (const o of orders) {
    const d = haversineKm(
      warehouse.lat,
      warehouse.lng,
      o.location.lat,
      o.location.lng
    );
    if (d <= NEARBY_RADIUS_KM) {
      const oo = ordersById.get(o.order_id)!;
      oo.distance = d;
      oo.angle = 0;
      ordersById.set(o.order_id, { ...oo });
      nearby.push(oo);
    }
  }
  const nearbyIds = new Set(nearby.map((o) => o.order_id));
  const nearbyOrders_weight = grossWeight(nearby);

  nearby.sort((a, b) => a.distance! - b.distance!);

  if (nearby.length && nearbyOrders_weight >= MIN_WEIGHT) {
    if (nearbyOrders_weight > MAX_WEIGHT) {
      const result = splitOrdersIntoClustersDynamic(
        nearby,
        CLOSE_TO_DISTANCE_KM + 20
        // ((CLOSE_TO_DISTANCE_KM / 100) * 45) // 45% of CLOSE_TO_DISTANCE_KM
      );
      if (result.clusters.length) geoClusters.push(...result.clusters);
      if (result.remainingOrders.length) {
        nearby.splice(0);
        nearby.push(...result.remainingOrders);
      }
    } else {
      // Single valid cluster within limits
      geoClusters.push([...nearby]);
      logger.info(`[Nearby Zone] Orders captured: ${nearby.length}`);
      nearby.splice(0);
    }
  }

  const remainingOrders = orders.filter((o) => !nearbyIds.has(o.order_id));
  if (!remainingOrders.length) return geoClusters;

  // --- Phase 2: Sectors ---
  const sectors = new Map<
    number,
    (Order & { distance: number; angle: number })[]
  >();
  for (const o of remainingOrders) {
    const dx = o.location.lng! - warehouse.lng!;
    const dy = o.location.lat! - warehouse.lat!;
    const angle = Math.atan2(dy, dx);
    const normalized = angle + Math.PI;
    const sectorId = Math.floor(normalized / SECTOR_ANGLE_RAD);
    const distance = haversineKm(
      warehouse.lat!,
      warehouse.lng!,
      o.location.lat!,
      o.location.lng!
    );

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
    sector.sort((a, b) => a.distance - b.distance)
  );

  const satisfiedSectors: Order[][] = [];
  if (nearby.length) {
    satisfiedSectors.push(nearby);
  }
  satisfiedSectors.push(...sortedSectors);

  // --- Phase 4: Radial clustering within sector ---
  const { clusters, leftovers } =
    buildClustersbyDensityDirection(satisfiedSectors);
  // console
  logger.info(`Warehoue ${warehouse.id}:${warehouse.town} has ${
    clusters.length
  } Clusters \n
    for orders: ${clusters.flatMap((cluster) =>
      cluster.map((o) => o.order_id)
    )} `);
  logger.info(
    `Clusters Weight: ${clusters
      .map((cluster) => grossWeight(cluster))
      .join(", ")}`
  );
  logger.info(
    `Leftover Orders: ${leftovers.map((o) => o.order_id).join(", ")}`
  );

  geoClusters.push(...clusters);
  return geoClusters;
}

function buildClustersbyDensityDirection(satisfiedSectors: Order[][]): {
  clusters: Order[][];
  leftovers: Order[];
} {
  const leftovers: Order[] = [];
  const geoClusters: Order[][] = [];
  const pendingSectors = [...satisfiedSectors];

  while (pendingSectors.length > 0) {
    const currentSector = pendingSectors.shift()!;

    const { clusters, remainingOrders } = splitOrdersIntoClustersDynamic(
      currentSector,
      CLOSE_TO_DISTANCE_KM
    );
    if (clusters.length) geoClusters.push(...clusters);

    if (remainingOrders.length > 0) {
      const lastOrder = remainingOrders.at(-1)!;
      let nearestSectorIdx = -1;
      let nearestDist = Number.POSITIVE_INFINITY;

      pendingSectors.forEach((sector, idx) => {
        if (sector.length === 0) return;
        const firstOrder = sector[0];
        const d = haversineKm(
          lastOrder.location.lat!,
          lastOrder.location.lng!,
          firstOrder.location.lat!,
          firstOrder.location.lng!
        );
        if (d < nearestDist && d < CLOSE_TO_DISTANCE_KM) {
          nearestDist = d;
          nearestSectorIdx = idx;
        }
      });
      if (nearestSectorIdx !== -1) {
        const nearestSector = pendingSectors.splice(nearestSectorIdx, 1)[0];
        const merge = [...remainingOrders, ...nearestSector];

        const { clusters: mergedClusters, remainingOrders: stillRemaining } =
          splitOrdersIntoClustersDynamic(merge, CLOSE_TO_DISTANCE_KM);

        if (mergedClusters.length) geoClusters.push(...mergedClusters);

        if (stillRemaining.length > 0) {
          const remainingFromNearestSector = stillRemaining.filter(
            (o) => !remainingOrders.includes(o)
          );

          grossWeight(remainingFromNearestSector) > MIN_WEIGHT
            ? pendingSectors.push(remainingFromNearestSector)
            : leftovers.push(...stillRemaining);
        }
      } else {
        leftovers.push(...remainingOrders);
      }
    }
  }

  logger.info(`[Cluster Added] Size: ${geoClusters.length}`);
  return { clusters: geoClusters, leftovers };
}

export function clusterOrdersBySector(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  if (orders.length <= MIN_ORDERS) return [orders];

  const withPolar = orders.map((o) => {
    const dx = o.location.lng! - warehouse.lng!;
    const dy = o.location.lat! - warehouse.lat!;
    const angle = Math.atan2(dy, dx); // -PI..PI
    const distance = haversineKm(
      warehouse.lat!,
      warehouse.lng!,
      o.location.lat!,
      o.location.lng!
    );
    return { order: o, angle, distance };
  });

  // assign to sectors
  const sectors = new Map<number, typeof withPolar>();
  for (const item of withPolar) {
    const normalized = item.angle + Math.PI; // 0..2PI
    const sectorId = Math.floor(normalized / SECTOR_ANGLE_RAD);
    if (!sectors.has(sectorId)) sectors.set(sectorId, []);
    sectors.get(sectorId)!.push(item);
  }

  // cluster inside sectors
  const clusters: Order[][] = [];

  for (const sectorItems of sectors.values()) {
    sectorItems.sort((a, b) => a.distance - b.distance);
    let current: Order[] = [];
    for (const item of sectorItems) {
      if (current.length === 0) {
        current.push(item.order);
        continue;
      }
      const last = current.at(-1)!;
      const d = haversineKm(
        last.location.lat!,
        last.location.lng!,
        item.order.location.lat!,
        item.order.location.lng!
      );
      if (d < CLOSE_TO_DISTANCE_KM && current.length < MAX_CLUSTER_SIZE) {
        current.push(item.order);
      } else {
        clusters.push([...current]);
        current = [item.order];
      }
    }
    if (current.length) clusters.push([...current]);
  }

  return mergeSmallClusters(clusters, warehouse);
}

export function clusterOrdersRadialByLastOrder(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  if (!orders.length) return [];

  // Precompute distances from each order to every other order
  const ordersMap = new Map<number, Order & { distanceFromWH: number }>();
  orders.forEach((order) => {
    ordersMap.set(order.order_id, {
      ...order,
      distanceFromWH: haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        order.location.lat!,
        order.location.lng!
      ),
    });
  });

  const remaining = new Set(orders.map((o) => o.order_id));
  const clusters: Order[][] = [];

  while (remaining.size > 0) {
    const cluster: Order[] = [];

    // Step 1: pick the nearest remaining order to the warehouse as starting point
    let currentOrder = Array.from(remaining)
      .map((id) => ordersMap.get(id)!)
      .sort((a, b) => a.distanceFromWH - b.distanceFromWH)[0];

    cluster.push(currentOrder);
    remaining.delete(currentOrder.order_id);

    // Step 2: expand cluster radially based on last added order
    while (cluster.length < MAX_CLUSTER_SIZE && remaining.size > 0) {
      // Find nearest remaining order to the last order in cluster
      const lastOrder = cluster[cluster.length - 1];

      let nearestOrder: (Order & { distanceFromWH: number }) | null = null;
      let nearestDistance = Infinity;

      for (const id of remaining) {
        const order = ordersMap.get(id)!;
        const distance = haversineKm(
          lastOrder.location.lat!,
          lastOrder.location.lng!,
          order.location.lat!,
          order.location.lng!
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestOrder = order;
        }
      }

      if (!nearestOrder) break;

      cluster.push(nearestOrder);
      remaining.delete(nearestOrder.order_id);
    }

    // Step 3: push cluster if it meets MIN_ORDERS, else merge with last cluster
    if (cluster.length >= MIN_ORDERS) {
      clusters.push(cluster);
    } else if (cluster.length > 0) {
      if (clusters.length) {
        clusters[clusters.length - 1].push(...cluster);
      } else {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
}

// merge small clusters into nearest large cluster centroid
function mergeSmallClusters(
  clusters: Order[][],
  warehouse: Warehouse
): Order[][] {
  const large = clusters.filter((c) => c.length >= MIN_ORDERS);
  const small = clusters.filter((c) => c.length < MIN_ORDERS);

  if (!large.length) {
    // fallback: combine small clusters into groups of MIN_ORDERS
    const result: Order[][] = [];
    let acc: Order[] = [];
    for (const s of small) {
      acc.push(...s);
      if (acc.length >= MIN_ORDERS) {
        result.push(acc.splice(0, acc.length));
        acc = [];
      }
    }
    if (acc.length) {
      if (result.length) result[result.length - 1].push(...acc);
      else result.push(acc);
    }
    return result;
  }

  const centroids = large.map((c) => clusterCentroid(c));
  for (const s of small) {
    const sCent = clusterCentroid(s);
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const d = haversineKm(
        sCent.lat,
        sCent.lng,
        centroids[i].lat,
        centroids[i].lng
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    large[bestIdx].push(...s);
    centroids[bestIdx] = clusterCentroid(large[bestIdx]);
  }

  // ensure max cluster size not exceeded
  const final: Order[][] = [];
  for (const c of large) {
    if (c.length <= MAX_CLUSTER_SIZE) final.push(c);
    else {
      // split by radial order (approx)
      const sorted = [...c].sort((a, b) => {
        const da = haversineKm(
          warehouse.lat!,
          warehouse.lng!,
          a.location.lat!,
          a.location.lng!
        );
        const db = haversineKm(
          warehouse.lat!,
          warehouse.lng!,
          b.location.lat!,
          b.location.lng!
        );
        return da - db;
      });
      for (let i = 0; i < sorted.length; i += MAX_CLUSTER_SIZE) {
        final.push(sorted.slice(i, i + MAX_CLUSTER_SIZE));
      }
    }
  }
  return final;
}
function clusterCentroid(cluster: Order[]) {
  const lat = cluster.reduce((s, o) => s + o.location.lat!, 0) / cluster.length;
  const lng = cluster.reduce((s, o) => s + o.location.lng!, 0) / cluster.length;
  return { lat, lng };
}

type ClusterResult = {
  clusters: Order[][];
  remainingOrders: Order[];
};
function splitOrdersIntoClustersDynamic(
  orders: Order[],
  proximityLimitKm: number
): ClusterResult {
  const remainingOrders: Order[] = [];
  const clusters: Order[][] = [];

  const orderMap = new Map<number, Order>();
  const unprocessedIds = new Set<number>();
  for (const order of orders) {
    orderMap.set(order.order_id, order);
    unprocessedIds.add(order.order_id);
  }

  for (const order of orders) {
    if (order.weight_kg! >= MIN_WEIGHT) {
      clusters.push([order]);
      unprocessedIds.delete(order.order_id);
    }
  }

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

        if (
          d <= proximityLimitKm &&
          clusterWeight + order.weight_kg! <= MAX_WEIGHT
        ) {
          if (d < closestDistance) {
            closestDistance = d;
            closestId = id;
          }
        }
      }

      if (closestId !== null) {
        const nextOrder = orderMap.get(closestId)!;
        cluster.push(nextOrder);
        clusterWeight += nextOrder.weight_kg!;
        unprocessedIds.delete(closestId);

        const validPoints = cluster.filter(
          (o) =>
            o.location &&
            typeof o.location.lat === "number" &&
            typeof o.location.lng === "number"
        );

        if (validPoints.length > 0) {
          centroidLat =
            validPoints.reduce((sum, o) => sum + o.location.lat, 0) /
            validPoints.length;
          centroidLng =
            validPoints.reduce((sum, o) => sum + o.location.lng, 0) /
            validPoints.length;
        } else {
          // fallback to previous centroid (don't change)
          logger.warn(
            `[Clustering] Invalid centroid fo orders ${nextOrder.order_id} — keeping previous coordinates`
          );
        }

        added = true;
      }
    }

    if (clusterWeight >= MIN_WEIGHT) {
      clusters.push(cluster);
    } else {
      remainingOrders.push(...cluster);
    }
  }

  return { clusters, remainingOrders };
}

// Orders proximity assignment
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
    if (!order.location.lat || !order.location.lng) {
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
