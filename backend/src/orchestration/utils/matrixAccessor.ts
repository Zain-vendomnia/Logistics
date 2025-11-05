import { MatrixData } from "../../types/hereMap.types";
import { Order } from "../../types/order.types";

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

// interface LatLng {
//   lat: number;
//   lng: number;
// }

interface TourStats {
  totalDistanceKm: number;
  totalDurationHrs: number;
}

// Compute heuristic total distance/duration from raw HERE matrix.
// Starts from index 0 (HW) and uses nearest neighbor.
export function computeHeuristicTourStats(matrix: MatrixData): TourStats {
  const n = matrix.numOrigins;
  const m = matrix.numDestinations;
  if (!n || !m || !matrix.distances?.length || !matrix.travelTimes?.length) {
    return { totalDistanceKm: 0, totalDurationHrs: 0 };
  }

  // Reconstruct 2D arrays safely
  const distances2D: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) =>
      matrix.distances[i * m + j] ?? Infinity
    )
  );
  console.table(distances2D);

  const travelTimes2D: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) =>
      matrix.travelTimes[i * m + j] ?? Infinity
    )
  );

  // Nearest-neighbor heuristic
  const visited = Array(n).fill(false);
  let current = 0; // assume warehouse index = 0
  visited[current] = true;

  let totalDistance = 0;
  let totalDuration = 0;

  for (let step = 1; step < n; step++) {
    let nearest = -1;
    let minDist = Infinity;

    for (let i = 1; i < n; i++) {
      const d = distances2D[current][i];
      if (!visited[i] && d > 0 && d < minDist && isFinite(d)) {
        minDist = d;
        nearest = i;
      }
    }

    if (nearest === -1) {
      console.warn(`No reachable next stop found at step ${step}`);
      break;
    }

    totalDistance += distances2D[current][nearest];
    totalDuration += travelTimes2D[current][nearest];

    visited[nearest] = true;
    current = nearest;
  }

  // Return to warehouse (if valid path exists)
  const returnDist = distances2D[current][0];
  const returnTime = travelTimes2D[current][0];
  if (isFinite(returnDist) && returnDist > 0) {
    totalDistance += returnDist;
  }
  if (isFinite(returnTime) && returnTime > 0) {
    totalDuration += returnTime;
  }

  return {
    totalDistanceKm: +(totalDistance / 1000).toFixed(2),
    totalDurationHrs: +(totalDuration / 3600).toFixed(2),
  };
}
