import logger from "../config/logger";
import { haversineKm } from "../helpers/tour.helper";
import { MatrixData } from "../types/hereMap.types";
import { Order } from "../types/order.types";
import { Tour } from "../types/tour.types";
import { Warehouse } from "../types/warehouse.types";
// import { logWithTime } from "../utils/logging";

const SECTOR_ANGLE_DEG = 180;
const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;
// const MATRIX_CONCURRENCY = 3; // Concurrent calls
// const MATRIX_RETRY = 2;
// const MATRIX_RETRY_DELAY_MS = 1000;

const MIN_ORDERS = 10;
const MAX_CLUSTER_SIZE = 15;
const CLOSE_TO_DISTANCE_KM = 25; // between consecutive orders (your local value)
const TIME_WINDOW_HOURS = 10;
// const MAX_TOUR_DISTANCE_METERS = 600 * 1000; // 600 km -> meters
const SERVICE_TIME_PER_STOP_MIN = 5;
const AVERAGE_SPEED_KMPH = 100;

const MIN_WEIGHT = 1250; // warehouse.gross_weight_kg!;
const MAX_WEIGHT = MIN_WEIGHT + 250;

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

export function clusterOrdersByDensDirection(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  const MIN_WEIGHT = warehouse.gross_weight_kg!;
  const MAX_WEIGHT = MIN_WEIGHT + 250;
  console.log(MAX_WEIGHT);

  const NEARBY_RADIUS_KM = 120;
  const SECTOR_ANGLE_DEG = 90;
  const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;
  // const MAX_CLUSTER_SIZE = 20;
  // const MIN_ORDERS = 10;

  if (!orders.length) return [];

  const clusters: Order[][] = [];

  // --- Phase 1: Nearby zone ---
  const nearbyOrders = orders.filter(
    (o) =>
      haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        o.location.lat!,
        o.location.lng!
      ) <= NEARBY_RADIUS_KM
  );
  if (nearbyOrders.length) {
    clusters.push([...nearbyOrders]);
    logger.info(`[Nearby Zone] Orders captured: ${nearbyOrders.length}`);
  }

  const remainingOrders = orders.filter((o) => !nearbyOrders.includes(o));
  if (!remainingOrders.length) return clusters;

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

  const shortSectors: (Order & { distance: number; angle: number })[][] = [];
  const satisfiedSectors: (Order & { distance: number; angle: number })[][] =
    [];

  for (const sector of sortedSectors) {
    if (sector.length < MIN_ORDERS) shortSectors.push(sector);
    else satisfiedSectors.push(sector);
  }

  const mergedSectors = mergeShortSectors(shortSectors);

  satisfiedSectors.push(...mergedSectors);

  // --- Phase 4: Radial clustering within sector ---
  const geoClusters = buildClustersbyDensityDirection(satisfiedSectors);

  clusters.push(...geoClusters);
  logger.info(`[Total Clusters]: ${clusters.length}`);
  return clusters;
}

function mergeShortSectors(
  shortSectors: (Order & { distance: number; angle: number })[][]
) {
  const mergedSectors: (Order & { distance: number; angle: number })[][] = [];

  while (shortSectors.length > 0) {
    // Take one short sector
    const base = shortSectors.shift()!;
    let merged = [...base];

    while (merged.length <= MIN_ORDERS) {
      // Find the nearest other short sector
      let nearestIdx = -1;
      let nearestDist = Infinity;
      const lastOrder = merged.at(-1)!; // outermost order

      shortSectors.forEach((sec, idx) => {
        const firstOrder = sec[0];
        const d = haversineKm(
          lastOrder.location.lat!,
          lastOrder.location.lng!,
          firstOrder.location.lat!,
          firstOrder.location.lng!
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = idx;
        }
      });

      if (nearestIdx === -1) break;

      // Merge with nearest short sector if one exists
      if (nearestIdx >= 0) {
        const nearestSector = shortSectors.splice(nearestIdx, 1)[0];
        merged.push(...nearestSector);
      }
    }

    mergedSectors.push(merged);
  }
  return mergedSectors;
}

function buildClustersbyDensityDirection(
  satisfiedSectors: (Order & { distance: number; angle: number })[][]
): Order[][] {
  const geoClusters: Order[][] = [];
  const pendingSectors = [...satisfiedSectors];

  while (pendingSectors.length > 0) {
    // Take one sector to start
    const currentSector = pendingSectors.shift()!;
    currentSector.sort((a, b) => a.distance - b.distance);

    const remaining = new Set(currentSector.map((o) => o.order_id));

    while (remaining.size > 0) {
      const cluster: Order[] = [];
      let current = currentSector.find((o) => remaining.has(o.order_id))!;
      cluster.push(current);
      remaining.delete(current.order_id);

      // Build cluster inside current sector
      while (cluster.length < MAX_CLUSTER_SIZE && remaining.size > 0) {
        const last = cluster.at(-1)!;
        let nearest: Order | null = null;
        let nearestDist = Infinity;

        for (const id of remaining) {
          const next = currentSector.find((o) => o.order_id === id)!;
          const d = haversineKm(
            last.location.lat!,
            last.location.lng!,
            next.location.lat!,
            next.location.lng!
          );
          if (d < nearestDist) {
            nearestDist = d;
            nearest = next;
          }
        }

        if (!nearest) break;
        cluster.push(nearest);
        remaining.delete(nearest.order_id);
      }

      // ---- Iterative merge with pending sectors if under MIN_ORDERS ----
      while (cluster.length < MIN_ORDERS && pendingSectors.length > 0) {
        const last = cluster.at(-1)!;
        let nearestSectorIdx = -1;
        let nearestDist = Infinity;

        // Find nearest sector to last order in cluster
        pendingSectors.forEach((sec, idx) => {
          if (sec.length === 0) return;
          const firstOrder = sec[0];
          const d = haversineKm(
            last.location.lat!,
            last.location.lng!,
            firstOrder.location.lat!,
            firstOrder.location.lng!
          );
          if (d < nearestDist) {
            nearestDist = d;
            nearestSectorIdx = idx;
          }
        });

        if (nearestSectorIdx === -1) break; // No more sectors

        const nearestSector = pendingSectors.splice(nearestSectorIdx, 1)[0];
        nearestSector.sort((a, b) => a.distance - b.distance);

        // Add orders from nearest sector until cluster is full or sector exhausted
        for (const o of nearestSector) {
          if (cluster.length >= MAX_CLUSTER_SIZE) break;
          cluster.push(o);
        }
      }

      // ---- Add finalized cluster ----
      geoClusters.push(cluster);
      logger.info(`[Cluster Added] Size: ${cluster.length}`);
    }
  }

  return geoClusters;
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

function makeMatrixAccessor(matrix: MatrixData) {
  const { numOrigins, numDestinations, travelTimes, distances } = matrix;
  const getTravelSec = (origIndex: number, destIndex: number) =>
    travelTimes[origIndex * numDestinations + destIndex] ?? Infinity;
  const getDistanceMeters = (origIndex: number, destIndex: number) =>
    distances[origIndex * numDestinations + destIndex] ?? Infinity;
  return { getTravelSec, getDistanceMeters, numOrigins, numDestinations };
}

export function computeTourDurationUsingMatrix(
  matrix: MatrixData,
  ordersSequence: Order[],
  indexMap: Map<number, number>
): number {
  const { getTravelSec } = makeMatrixAccessor(matrix);
  let totalSec = 0;

  const orderCount = ordersSequence.length;

  // warehouse -> first order
  const firstOrderIdx = indexMap.get(ordersSequence[0].order_id);
  if (firstOrderIdx !== undefined) {
    totalSec += getTravelSec(0, firstOrderIdx);
  }

  for (let i = 1; i < orderCount - 1; i++) {
    const fromIdx = indexMap.get(ordersSequence[i].order_id);
    const toIdx = indexMap.get(ordersSequence[i + 1].order_id);

    if (fromIdx !== undefined && toIdx !== undefined) {
      totalSec += getTravelSec(fromIdx, toIdx);
    }
  }

  // last order -> warehouse
  const lastOrderIdx = indexMap.get(
    ordersSequence[ordersSequence.length - 1].order_id
  );

  if (lastOrderIdx !== undefined) {
    totalSec += getTravelSec(lastOrderIdx, 0);
  }

  return totalSec;
}

export function computeTourDistanceUsingMatrix(
  matrix: MatrixData,
  ordersSequence: Order[],
  indexMap: Map<number, number>
): number {
  // const { getDistanceMeters } = makeMatrixAccessor(matrix);
  // const orderCount = ordersSequence.length;

  // let totalDis = 0;
  // // warehouse -> first
  // totalDis = getDistanceMeters(0, 0);

  // // consecutive
  // for (let i = 1; i < orderCount; i++) {
  //   totalDis += getDistanceMeters(i, i);
  // }
  // // last order -> warehouse
  // // origin index = last order idx; dest index = warehouse idx (=orderCount)
  // totalDis += getDistanceMeters(orderCount, orderCount);

  // return totalDis;

  const { getDistanceMeters } = makeMatrixAccessor(matrix);
  let totalDis = 0;

  const orderCount = ordersSequence.length;

  // warehouse -> first order
  const firstOrderIdx = indexMap.get(ordersSequence[0].order_id);
  if (firstOrderIdx !== undefined) {
    totalDis += getDistanceMeters(0, firstOrderIdx);
  }

  for (let i = 1; i < orderCount - 1; i++) {
    const fromIdx = indexMap.get(ordersSequence[i].order_id);
    const toIdx = indexMap.get(ordersSequence[i + 1].order_id);

    if (fromIdx !== undefined && toIdx !== undefined) {
      totalDis += getDistanceMeters(fromIdx, toIdx);
    }
  }

  // last order -> warehouse
  const lastOrderIdx = indexMap.get(
    ordersSequence[ordersSequence.length - 1].order_id
  );

  if (lastOrderIdx !== undefined) {
    totalDis += getDistanceMeters(lastOrderIdx, 0);
  }
  return totalDis;
}
