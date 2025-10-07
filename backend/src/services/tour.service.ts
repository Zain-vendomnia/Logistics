import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { LogisticOrder, OrderStatus } from "../model/LogisticOrders";
import { route_segments } from "../model/routeSegments";
import { tourInfo_master } from "../model/TourinfoMaster";
import {
  createTourAsync,
  removeUnassignedOrdersFromTour,
} from "../model/tourModel";
import { CreateTour, NotAssigned, TourMatrix } from "../types/dto.types";
import { DecodedRoute, Unassigned } from "../types/hereMap.types";
import {
  Tour,
  LogisticsRoute,
  TourType,
  DeliveryCostRates,
} from "../types/tour.types";
import hereMapService from "./hereMap.service";
import pool from "../config/database";
import {
  calculateOrderWeight,
  extractTourStats,
} from "./helpers/dynamicTour.helpers";

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
): Promise<TourMatrix> {
  const connection = await pool.getConnection();
  try {
    console.info("function createDeliveryCostForTour Starting...");

    await connection.beginTransaction();

    // 1️⃣ Get tour data
    let tourData: any;
    if (type === TourType.dynamicTour) {
      const [rows]: any = await connection.execute(
        `SELECT orderIds, tour_data FROM dynamic_tours WHERE id = ?`,
        [tourId]
      );
      tourData = rows[0];
    } else {
      const [rows]: any = await connection.execute(
        `SELECT order_ids AS orderIds, tour_data FROM tourinfo_master WHERE id = ?`,
        [tourId]
      );
      tourData = rows[0];
    }

    if (!tourData) throw new Error(`Tour ${tourId} not found`);

    // 2️⃣ Compute totals
    const orderWithItems = await LogisticOrder.getOrdersWithItemsAsync(
      tourData.orderIds.split(",").map(Number)
    );
    const totalWeightKg = orderWithItems.reduce(
      (acc, order) => acc + calculateOrderWeight(order),
      0
    );

    const tour = tourData.tour_data.tour as Tour;
    const { totalDistanceKm, totalDurationHrs } = extractTourStats(tour);

    // 3️⃣ Get delivery cost rates
    const [ratesRows]: any = await connection.execute(`
      SELECT * FROM delivery_cost_rates
      ORDER BY id DESC
      LIMIT 1
    `);
    const rates = ratesRows[0] as DeliveryCostRates;
    if (!rates) throw new Error("No delivery cost rates found");

    // 4️⃣ Compute costs
    const personnelCost = rates.personnel_costs_per_hour * totalDurationHrs;
    const dieselCost =
      (rates.diesel_costs_per_liter *
        rates.consumption_l_per_100km *
        totalDistanceKm) /
      100;
    const vanCost = rates.van_costs_per_day;
    const totalCost: number =
      +rates.hotel_costs + +vanCost + +dieselCost + +personnelCost;

    const costPerStop = totalCost / orderWithItems.length; // Order stops
    const costPerBkw = totalCost / 5; // TODO: real bkw count
    const costPerSlmd = totalCost / 5; // TODO: real slmd count

    console.log("orderWithItems: ", orderWithItems);
    console.log("orderWithItems[0] items: ", orderWithItems[0].items);

    console.log("totalWeightKg: ", totalWeightKg);
    console.log("totalDistanceKm: ", totalDistanceKm);
    console.log("totalDurationHrs: ", totalDurationHrs);

    console.log("personnelCost: ", personnelCost);
    console.log("dieselCost: ", dieselCost);
    console.log("vanCost: ", vanCost);
    console.log("rates.hotel_costs: ", rates.hotel_costs);
    console.log("totalCost: ", totalCost);

    console.log("costPerStop: ", costPerStop);
    console.log("costPerBkw: ", costPerBkw);
    console.log("costPerSlmd: ", costPerSlmd);

    // 5️⃣ Check if already exists
    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";
    const [matrixRows]: any = await connection.execute(
      `SELECT * FROM delivery_cost_per_tour WHERE ${idColumn} = ?`,
      [tourId]
    );
    const isExist = matrixRows[0];

    // 6️⃣ Insert or update
    let query_matrix = "";
    let params: any[] = [];

    if (!isExist) {
      query_matrix = `
        INSERT INTO delivery_cost_per_tour (
          ${idColumn}, hotel_cost, van_tour_cost, diesel_tour_cost,
          personnel_tour_cost, total_cost,
          delivery_cost_per_stop, delivery_cost_per_bkw, delivery_cost_per_slmd,
          total_distance_km, total_duration_hrs, total_weight_kg,
          warehouse_tour_cost, infeed_tour_cost, we_tour_cost, wa_tour_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
      `;
      params = [
        tourId,
        rates.hotel_costs,
        vanCost,
        dieselCost,
        personnelCost,
        totalCost,
        costPerStop,
        costPerBkw,
        costPerSlmd,
        totalDistanceKm,
        totalDurationHrs,
        totalWeightKg,
      ];
    } else {
      query_matrix = `
        UPDATE delivery_cost_per_tour
        SET hotel_cost = ?,
            van_tour_cost = ?,
            diesel_tour_cost = ?,
            personnel_tour_cost = ?,
            total_cost = ?,
            delivery_cost_per_stop = ?,
            delivery_cost_per_bkw = ?,
            delivery_cost_per_slmd = ?,
            total_distance_km = ?,
            total_duration_hrs = ?,
            total_weight_kg = ?
        WHERE ${idColumn} = ?
      `;
      params = [
        rates.hotel_costs,
        vanCost,
        dieselCost,
        personnelCost,
        totalCost,
        costPerStop,
        costPerBkw,
        costPerSlmd,
        totalDistanceKm,
        totalDurationHrs,
        totalWeightKg,
        tourId,
      ];
    }

    const [result]: any = await connection.execute<ResultSetHeader>(
      query_matrix,
      params
    );

    const targetId = isExist ? isExist.id : result.insertId;
    console.info(isExist ? "Tour cost UPDATED: " : "Tour cost CREATED: ", {
      targetId,
    });

    // 7️⃣ Return row
    const [rows]: any = await connection.execute(
      `SELECT * FROM delivery_cost_per_tour WHERE id = ?`,
      [targetId]
    );

    await connection.commit();
    return rows[0] as TourMatrix;
  } catch (error) {
    await connection.rollback();
    console.error("Error creating delivery cost for tour:", error);
    throw error;
  } finally {
    console.info("function createDeliveryCostForTour Ending...");
    connection.release();
  }
}

export async function getTourMatrix(
  tourId: number,
  type: TourType = TourType.dynamicTour
): Promise<TourMatrix> {
  try {
    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";

    const [rows]: any = await pool.execute(
      `SELECT * FROM delivery_cost_per_tour  WHERE ${idColumn} = ?`,
      [tourId]
    );

    return rows[0] as TourMatrix;
  } catch (error) {
    console.error(`Error fetching Tour Matrix for tour Id: ${tourId}:`, error);
    throw error;
  }
}
