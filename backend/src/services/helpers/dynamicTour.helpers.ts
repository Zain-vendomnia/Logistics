import { PoolConnection } from "mysql2/promise";
import { DynamicTourPayload, UnassignedRes } from "../../types/dto.types";
import { getDynamicTour } from "../dynamicTour.service";
import { LogisticOrder, OrderStatus } from "../../model/LogisticOrders";

function validatePayload(payload: DynamicTourPayload) {
  if (!payload || !payload.orderIds || !payload.warehouse_id) {
    throw new Error(`Invalid payload: ${JSON.stringify(payload)}`);
  }
}

function buildUnassignedOrders(
  unassigned: any[],
  orders: LogisticOrder[]
): UnassignedRes[] {
  if (!unassigned || unassigned.length === 0) return [];

  const order_number_map = new Map<number, string>(
    orders.map((o) => [o.order_id, o.order_number])
  );

  return unassigned.map((u) => {
    const order_id = Number(u.jobId.split("_")[1]);
    return {
      orderId: order_id,
      order_number: order_number_map.get(order_id) ?? "",
      reasons: u.reasons.map((r: any) => `${r.code}:${r.description}`),
    };
  });
}

async function handleExistingTour(
  connection: PoolConnection,
  payload: DynamicTourPayload,
  payload_orderIds: number[]
) {
  let remove_orderIds: number[] = [];
  try {
    const ex_dTour = await getDynamicTour(payload.id!);
    if (!ex_dTour) return;

    const ex_dTour_orderIds = ex_dTour.orderIds.split(",").map(Number);
    remove_orderIds = ex_dTour_orderIds.filter(
      (o) => !payload_orderIds.includes(o)
    );

    if (remove_orderIds.length > 0) {
      await LogisticOrder.updateOrdersStatus(
        connection,
        remove_orderIds,
        OrderStatus.unassigned
      );
    }
  } catch (error) {
    const err = new Error(
      `handleExistingTour failed for tour_id=${
        payload.id
      } | remove_orderIds=${JSON.stringify(remove_orderIds)}`,
      { cause: error as Error }
    );
    console.error(err);
    throw err;
  }
}

// async function persistDynamicTour(
//   connection: PoolConnection,
//   payload: DynamicTourPayload,
//   txnOrderIds: string
// ): Promise<DynamicTourPayload> {
//   const tourName = await generateTourName(
//     payload.orderIds.split(",").map((o) => Number(o))
//   );

//   try {
//     const dynamicTour: DynamicTourPayload = {
//       ...payload,
//       tour_name: tourName,
//       orderIds: txnOrderIds,
//     };

//     const createdDTour = await saveDynamicTour(connection, dynamicTour);

//     const txnOrder_ids: number[] = txnOrderIds.split(",").map(Number);
//     await LogisticOrder.updateOrdersStatus(
//       connection,
//       txnOrder_ids,
//       OrderStatus.assigned
//     );

//     const payload_orderIds = payload.orderIds.split(",").map(Number);
//     const xOrder_ids = payload_orderIds.filter(
//       (o) => !txnOrder_ids.includes(o)
//     );

//     if (xOrder_ids.length > 0) {
//       await LogisticOrder.updateOrdersStatus(
//         connection,
//         xOrder_ids,
//         OrderStatus.unassigned
//       );
//     }

//     return createdDTour;
//   } catch (error) {
//     const err = new Error(
//       `[Persist Dynamic Tour] failed for tour_id=${payload.tour_name} | txnOrderIds = ${txnOrderIds}`,
//       { cause: error as Error }
//     );
//     console.error(err);
//     throw err;
//   }
// }

type TourStats = {
  totalDistanceKm: number;
  totalDurationHrs: number;
  drivingHrs?: number;
  servingHrs?: number;
};

function extractTourStats(tour: any): TourStats {
  let response: TourStats = {
    totalDistanceKm: 0,
    totalDurationHrs: 0,
    drivingHrs: 0,
    servingHrs: 0,
  };

  if (tour?.statistic) {
    const stats = tour.statistic;
    response = {
      totalDistanceKm: +(stats.distance / 1000).toFixed(2),
      totalDurationHrs: +(stats.duration / 3600).toFixed(2),
      drivingHrs: +(stats.times.driving / 3600).toFixed(2),
      servingHrs: +(stats.times.serving / 3600).toFixed(2),
    };
    return response;
  }

  if (tour?.sections?.length) {
    const summary = tour.sections[0].summary;
    response = {
      ...response,
      totalDistanceKm: +(summary.length / 1000).toFixed(2),
      totalDurationHrs: +(summary.duration / 3600).toFixed(2),
    };
    return response;
  }

  if (tour?.stops?.length) {
    const stops = tour.stops;
    const first = stops[0];
    const last = stops[stops.length - 1];

    const totalDistance = last.distance ?? 0;
    const totalDuration =
      new Date(last.time.arrival).getTime() -
      new Date(first.time.departure).getTime();

    response = {
      ...response,
      totalDistanceKm: +(totalDistance / 1000).toFixed(2),
      totalDurationHrs: +(totalDuration / 1000 / 3600).toFixed(2),
    };
    return response;
  }

  console.error("Unsupported tour response format");
  console.error("Tour Object Provided:", tour);
  return response;
}

export {
  validatePayload,
  buildUnassignedOrders,
  handleExistingTour,
  // persistDynamicTour,
  extractTourStats,
};
