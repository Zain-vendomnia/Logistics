import { PoolConnection } from "mysql2/promise";
import { LogisticOrder, OrderStatus } from "../model/LogisticOrders";
import { route_segments } from "../model/routeSegments";
import { tourInfo_master } from "../model/TourinfoMaster";
import {
  createTourAsync,
  removeUnassignedOrdersFromTour,
} from "../model/tourModel";
import { CreateTour, NotAssigned } from "../types/dto.types";
import { DecodedRoute, Unassigned } from "../types/hereMap.types";
import { Tour, LogisticsRoute } from "../types/tour.types";
import hereMapService from "./hereMapService";
import pool from "../database";

export async function getTourMapDataAsync(tourPayload: CreateTour) {
  const connection = await pool.getConnection();

  try {
    const { tour, unassigned } = await hereMapService.CreateTourRouteAsync(
      tourPayload.orderIds,
      tourPayload.warehouseId
    );
    const routes = await getRouteSegments_mapApi(tour);

    await connection.beginTransaction();

    //Db table updates for tour
    const { tourId, tourName } = await createTourAsync(connection, tourPayload);

    const hereMapResJson = JSON.stringify({ tour, unassigned });
    await tourInfo_master.updateHereMapResponse(
      connection,
      tourId,
      hereMapResJson
    );

    await saveRouteSegments(connection, tourId, routes);

    const { unassignedOrderIds } = await updateTourOrdersStatus(
      connection,
      tourId,
      tourPayload.orderIds,
      unassigned
    );

    await connection.commit();

    // Prepare res
    const unassignedOrders = await LogisticOrder.getOrdersByIds(
      unassignedOrderIds
    );
    const notAssigned: NotAssigned[] = unassigned.map((u) => {
      const id = u.jobId.split("_")[1];
      const matchedOrder = unassignedOrders.find(
        (order) => order.order_id === Number(id)
      );
      return {
        id,
        orderNumber: matchedOrder?.order_number || null,
        reason: u.reasons,
      };
    });

    return {
      tour: tourName,
      routes,
      notAssigned,
      unassigned: unassignedOrders.map((o) => o.order_number).join(","),
    };
  } catch (error) {
    await connection.rollback();

    console.error("Transaction failed - Tour Creation:", error);
    throw new Error(`Tour creation failed ${(error as Error).message}`);
  } finally {
    connection.release();
  }
}

async function updateTourOrdersStatus(
  conn: PoolConnection,
  tourId: number,
  orderIds: number[],
  unassigned: Unassigned[]
) {
  const unassignedOrderIds: number[] = await extractUnassignedOrderIds(
    unassigned
  );

  if (unassignedOrderIds.length > 0) {
    console.log(`Removing ${unassignedOrderIds.length} unassigned order(s)`);

    await removeUnassignedOrdersFromTour(conn, tourId, unassignedOrderIds);

    const updated = await LogisticOrder.updateOrdersStatus(
      conn,
      unassignedOrderIds,
      OrderStatus.unassigned
    );
    console.log("Updated status for unassigned orders:", updated);
  }

  const assignedOrderIds = orderIds.filter(
    (id) => !unassignedOrderIds.includes(id)
  );

  const assignedOrders_upadted = await LogisticOrder.updateOrdersStatus(
    conn,
    assignedOrderIds,
    OrderStatus.assigned
  );
  console.log(`Update status assigned orders: `, assignedOrders_upadted);

  return { unassignedOrderIds };
}

export async function saveRouteSegments(
  conn: PoolConnection,
  tourId: number,
  routes: LogisticsRoute[]
): Promise<LogisticsRoute[]> {
  try {
    // const routes = await getRouteSegments_mapApi(tour);

    // Save route segments
    for (const segment of routes) {
      const segmentJson = JSON.stringify(segment);
      const orderId = segment.order_id;
      console.log(
        `Saving Route Segment for Tour Id: ${tourId} Order Id: ${orderId}`
      );

      if (!orderId)
        throw new Error(
          `Segment has invalid order_id: ${JSON.stringify(segment)}`
        );

      await route_segments.insertSegment(conn, tourId, segmentJson, orderId);
    }

    //   await Promise.all(
    //   routes.map((segment) =>
    //     route_segments.insertSegment(tourId, JSON.stringify(segment), segment.order_id)
    //   )
    // );

    console.log(`Saved ${routes.length} segments to segmentTable.`);

    return routes;
  } catch (error) {
    console.error("Error saving route segments:", error);
    return [];
  }
}

export async function getRouteSegments_mapApi(
  tour: Tour
): Promise<LogisticsRoute[]> {
  const segments: LogisticsRoute[] = [];

  const stops = tour.stops;

  for (let i = 0; i < stops.length; i++) {
    const origin = stops[i];
    const destination = stops[i + 1];
    if (!destination) break;

    const subTour: Tour = {
      ...tour,
      stops: [origin, destination],
    };
    const routes: DecodedRoute | null = await hereMapService.getRoutesForTour(
      subTour
    );

    if (!routes) throw new Error("Failsed to decode routes");

    console.log(
      `Route Segment created for Order Id ${destination.activities[0].jobId}`
    );

    const segment: LogisticsRoute = {
      from: {
        location_id: origin.activities[0].jobId,
        lat: origin.location.lat,
        lon: origin.location.lng,
        arr_time: origin.time.arrival,
        arr_date_time: origin.time.arrival,
      },
      to: {
        location_id: destination.activities[0].jobId,
        lat: destination.location.lat,
        lon: destination.location.lng,
        arr_time: destination.time.arrival,
        arr_date_time: destination.time.arrival,
      },
      distance_to: destination.distance,
      driving_time_to: destination.distance,
      geometry: routes,
      order_id: destination.activities[0].jobId,
    };

    segments.push(segment);
  }
  console.log("segments.length: ", segments.length);
  return segments;
}

// function createRouteSegments(tourRoute: DecodedRoute) {
//   const segments: LogisticsRoute[] = [];

//   for (let i = 0; i < tourRoute.stops.length; i++) {
//     const origin = tourRoute.stops[i];
//     const destination = tourRoute.stops[i + 1];

//     const segment: LogisticsRoute = {
//       from: {
//         location_id: origin.activities[0].jobId,
//         lat: origin.location.lat,
//         lon: origin.location.lng,
//         arr_time: origin.time.arrival,
//         arr_date_time: origin.time.arrival,
//       },
//       to: {
//         location_id: destination.activities[0].jobId,
//         lat: destination.location.lat,
//         lon: destination.location.lng,
//         arr_time: destination.time.arrival,
//         arr_date_time: destination.time.arrival,
//       },
//       distance_to: destination.distance,
//       driving_time_to: destination.distance,
//       geometry: { ...tourRoute, stops: tourRoute.stops[i] }, // routes
//       order_id: destination.activities[0].jobId,
//     };

//     segments.push(segment);
//   }
//   return segments;
// }

export async function extractUnassignedOrderIds(unassigned: Unassigned[]) {
  return unassigned
    .map((e) => Number(e.jobId.split("_")[1]))
    .filter((id) => !isNaN(id));
}

export async function getTourDetailsById(tourId: number) {
  const tourObj = await tourInfo_master.getTourNameByIdAsync(tourId);
  const routes = await route_segments.getAllRouteSegments_TourId(tourId);

  return { tour: tourObj.tour_name, routes, unassigned: "400098044,400098044" };
}
