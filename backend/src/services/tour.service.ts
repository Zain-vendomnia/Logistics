import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { LogisticOrder, OrderStatus } from "../model/LogisticOrders";
import { route_segments } from "../model/routeSegments";
import { tourInfo_master } from "../model/TourinfoMaster";
import {
  createTourAsync,
  removeUnassignedOrdersFromTour,
} from "../model/tourModel";
import { CreateTour, NotAssigned } from "../types/dto.types";
import { DecodedRoute, Unassigned } from "../types/hereMap.types";
import { Tour, LogisticsRoute, TourType } from "../types/tour.types";
import hereMapService from "./hereMap.service";
import pool from "../config/database";

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

export async function createDeliveryCostForTour(
  tourId: number,
  type: TourType = TourType.dynamicTour
): Promise<any> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch delivery cost rates
    const [ratesRows]: any = await connection.execute(`
    SELECT personnel_costs_per_hour, diesel_costs_per_liter, 
           consumption_l_per_100km, van_costs_per_day, hotel_costs
    FROM delivery_cost_rates
    ORDER BY id DESC
    LIMIT 1
  `);

    const rates = ratesRows[0];
    if (!rates) throw new Error("No delivery cost rates found");

    // Compute costs
    const personnelCost = rates.personnel_costs_per_hour * 8; // 8 tour hours
    const dieselCost =
      rates.diesel_costs_per_liter * rates.consumption_l_per_100km;
    const vanCost = rates.van_costs_per_day;
    const totalCost = rates.hotel_costs + vanCost + dieselCost + personnelCost;

    const costPerStop = totalCost / 10; // tour Stops
    const costPerBkw = totalCost / 5; // tour BKW
    const costPerSlmd = totalCost / 5; // tour SLMD

    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";

    // Insert into delivery_cost_per_tour
    const [insertResult]: any = await connection.execute<ResultSetHeader>(
      `INSERT INTO delivery_cost_per_tour (
      ${idColumn}, hotel_cost, van_tour_cost, diesel_tour_cost,
      personnel_tour_cost, total_cost,
      delivery_cost_per_stop, delivery_cost_per_bkw, delivery_cost_per_slmd,
      warehouse_tour_cost, infeed_tour_cost, we_tour_cost, wa_tour_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)`,
      [
        tourId,
        rates.hotel_costs,
        rates.van_costs_per_day,
        dieselCost,
        personnelCost,
        totalCost,
        costPerStop,
        costPerBkw,
        costPerSlmd,
      ]
    );

    const insertedId = insertResult.insertId;

    // Return the new row
    const [rows]: any = await connection.execute(
      `SELECT * FROM delivery_cost_per_tour WHERE id = ?`,
      [insertedId]
    );

    await connection.commit();

    return rows[0];
  } catch (error) {
    await connection.rollback();
    console.error("Error creating delivery cost for tour:", error);
    throw error;
  } finally {
    connection.release();
  }
}
