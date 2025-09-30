import { Order } from "../types/order.types";
import { Tour } from "../types/tour.types";
import { Warehouse } from "../types/warehouse.types";
import { haversineKm } from "../utils/haversine";
import { logWithTime } from "../utils/logging";

const MIN_ORDERS = 15;
const MAX_CLUSTER_SIZE = 50; // prevent oversized clusters
const CLOSE_TO_DISTANCE_KM = 60; // threshold to keep adding Order to Cluster

// tuning params
const AVERAGE_SPEED_KMPH = 100; // used for cheap approximation; tune per region
const SERVICE_TIME_PER_STOP_MIN = 5; // average service time per stop
const TIME_WINDOW_HOURS = 9; // max allowed duration per tour
// const MAX_DISTANCE_KM = 600;

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

  console.log(`Sorted Orders ${sorted}`);

  // Greedy clustering by proximity
  const clusters: Order[][] = [];
  let current: Order[] = [];

  for (const order of sorted) {
    if (current.length === 0) {
      current.push(order);
      console.log(`Current Cluster first Order - ID ${order.order_id}`);
      continue;
    }

    // distance from last order in cluster
    const last = current.at(-1);
    if (!last) continue;
    console.log(`Current Cluster last Order - ID ${last.order_id}`);

    console.log(
      `last.location.lat: ${last.location.lat},
      last.location.lng: ${last.location.lng},
      order.location.lat: ${order.location.lat},
      order.location.lng: ${order.location.lng}`
    );

    const d = haversineKm(
      last.location.lat,
      last.location.lng,
      order.location.lat,
      order.location.lng
    );
    console.log(
      `Distanse from Last Order ${last.order_id} to ${order.order_id}: ${d}`
    );

    // If order is reasonably close and cluster not too big → keep adding
    if (d < CLOSE_TO_DISTANCE_KM && current.length < MAX_CLUSTER_SIZE) {
      current.push(order);
      console.log(`1- Cluster Orders: ${current.length}`);
    } else {
      // finalize current cluster
      if (current.length >= MIN_ORDERS) {
        clusters.push(current);
        console.log(`2- Cluster Orders: ${current.length}`);
        console.log(`2- Clustersss Length: ${clusters.length}`);
      } else {
        // merge small leftover cluster with previous one
        if (clusters.length) {
          console.log(`3- Insufficient Cluster Orders: ${current.length}`);
          clusters[clusters.length - 1].push(...current);
        } else {
          console.log(`4- Insufficient Cluster Orders: ${current.length}`);
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

    logWithTime(
      `Duration ${approxSec} is ${
        approxSec < TIME_WINDOW_HOURS * 3600 ? "lesser" : "greater"
      } than ${TIME_WINDOW_HOURS * 3600}`
    );
    
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
