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
