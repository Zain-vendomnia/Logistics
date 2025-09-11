import { Order } from "../types/order.types";
import { Tour } from "../types/tour.types";
import { Warehouse } from "../types/warehouse.types";
import { haversineKm } from "../utils/haversine";

const MIN_ORDERS = 5;
const MAX_CLUSTER_SIZE = 26; // prevent oversized clusters
const CLOSE_TO_DISTANCE_KM = 15; // threshold to keep adding Order to Cluster

// tuning params
const AVERAGE_SPEED_KMPH = 80; // used for cheap approximation; tune per region
const SERVICE_TIME_PER_STOP_MIN = 5; // average service time per stop
const TIME_WINDOW_HOURS = 9; // max allowed duration per tour
const MAX_DISTANCE_KM = 600;

export function clusterOrders(
  orders: Order[],
  warehouse: Warehouse
): Order[][] {
  if (orders.length <= MIN_ORDERS) {
    return [orders]; // not enough to split
  }

  // Sort orders by distance from warehouse
  const sorted = [...orders].sort(
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

  // Greedy clustering by proximity
  const clusters: Order[][] = [];
  let current: Order[] = [];

  for (const order of sorted) {
    if (current.length === 0) {
      current.push(order);
      continue;
    }

    // distance from last order in cluster
    const last = current.at(-1);
    if (!last) continue;

    const d = haversineKm(
      last.location.lat,
      last.location.lng,
      order.location.lat,
      order.location.lng
    );

    // If order is reasonably close and cluster not too big → keep adding
    if (d < CLOSE_TO_DISTANCE_KM && current.length < MAX_CLUSTER_SIZE) {
      current.push(order);
    } else {
      // finalize current cluster
      if (current.length >= MIN_ORDERS) {
        clusters.push(current);
      } else {
        // merge small leftover cluster with previous one
        if (clusters.length) {
          clusters[clusters.length - 1].push(...current);
        } else {
          clusters.push(current);
        }
      }
      current = [order];
    }
  }

  // Push last cluster
  if (current.length) {
    if (current.length >= MIN_ORDERS) {
      clusters.push(current);
    } else if (clusters.length) {
      clusters[clusters.length - 1].push(...current);
    } else {
      clusters.push(current);
    }
  }

  return clusters;
}

export function secondsForApproxRoute(
  warehouse: Warehouse,
  ordered: Order[]
): number {
  if (!ordered.length) return 0;
  let totalKm = 0;
  // warehouse -> first
  totalKm += haversineKm(
    warehouse.lat!,
    warehouse.lng!,
    ordered[0].location.lat!,
    ordered[0].location.lng!
  );
  // consecutive legs
  for (let i = 1; i < ordered.length; i++) {
    totalKm += haversineKm(
      ordered[i - 1].location.lat!,
      ordered[i - 1].location.lng!,
      ordered[i].location.lat!,
      ordered[i].location.lng!
    );
  }
  // approximate travel time + service time
  const travelSec = (totalKm / AVERAGE_SPEED_KMPH) * 3600;
  const serviceSec = ordered.length * SERVICE_TIME_PER_STOP_MIN * 60;
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

/**
 * Trim cluster by removing farthest orders from warehouse until
 * estimated duration <= TIME_WINDOW_HOURS or cluster size < MIN_ORDERS.
 * Returns {fitted, trimmed}
 */
export function trimClusterToFit(
  warehouse: Warehouse,
  cluster: Order[]
): { fitted: Order[]; trimmed: Order[] } {
  const trimmed: Order[] = [];
  let fitted = [...cluster];

  while (fitted.length >= MIN_ORDERS) {
    const approxSec = secondsForApproxRoute(warehouse, fitted);
    if (approxSec <= TIME_WINDOW_HOURS * 3600) break;

    // remove farthest order from warehouse (heuristic)
    let farthestIdx = 0;
    let farthestDist = -Infinity;
    for (let i = 0; i < fitted.length; i++) {
      const o = fitted[i];
      const d = haversineKm(
        warehouse.lat!,
        warehouse.lng!,
        o.location.lat!,
        o.location.lng!
      );
      if (d > farthestDist) {
        farthestDist = d;
        farthestIdx = i;
      }
    }
    const [removed] = fitted.splice(farthestIdx, 1);
    trimmed.push(removed);
    // loop continues; recompute approxSec
  }

  // if after trimming we fell below MIN_ORDERS, treat all fitted orders as trimmed:
  if (fitted.length < MIN_ORDERS) {
    trimmed.push(...fitted);
    fitted = [];
  }

  return { fitted, trimmed };
}
