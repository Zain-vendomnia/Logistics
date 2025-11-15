import { haversineKm } from "../helpers/tour.helper";
import { MatrixData } from "../types/hereMap.types";
import { Order } from "../types/order.types";
import { Tour } from "../types/tour.types";
import { Warehouse } from "../types/warehouse.types";
// import { logWithTime } from "../utils/logging";

const SECTOR_ANGLE_DEG = 30;
const SECTOR_ANGLE_RAD = (SECTOR_ANGLE_DEG * Math.PI) / 180;
// const MATRIX_CONCURRENCY = 3; // Concurrent calls
// const MATRIX_RETRY = 2;
// const MATRIX_RETRY_DELAY_MS = 1000;

const MIN_ORDERS = 4;
const MAX_CLUSTER_SIZE = 7;
const CLOSE_TO_DISTANCE_KM = 25; // between consecutive orders (your local value)
const TIME_WINDOW_HOURS = 10;
// const MAX_TOUR_DISTANCE_METERS = 600 * 1000; // 600 km -> meters
const SERVICE_TIME_PER_STOP_MIN = 5;
const AVERAGE_SPEED_KMPH = 100;

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
  ordersSequence: Order[]
): number {
  const { getTravelSec } = makeMatrixAccessor(matrix);
  const orderCount = ordersSequence.length;

  let totalSec = 0;
  // warehouse -> first order
  totalSec = getTravelSec(0, 0);

  for (let i = 1; i < orderCount; i++) {
    totalSec += getTravelSec(i, i);
  }
  // last order -> warehouse
  totalSec += getTravelSec(orderCount, orderCount);

  return totalSec;
}

export function computeTourDistanceUsingMatrix(
  matrix: MatrixData,
  ordersSequence: Order[]
): number {
  const { getDistanceMeters } = makeMatrixAccessor(matrix);
  const orderCount = ordersSequence.length;

  let totalDis = 0;
  // warehouse -> first
  totalDis = getDistanceMeters(0, 0);

  // consecutive
  for (let i = 1; i < orderCount; i++) {
    totalDis += getDistanceMeters(i, i);
  }
  // last order -> warehouse
  // origin index = last order idx; dest index = warehouse idx (=orderCount)
  totalDis += getDistanceMeters(orderCount, orderCount);

  return totalDis;
}
