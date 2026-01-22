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
import {
  Tour,
  LogisticsRoute,
  TourType,
  DeliveryCostRates,
  TourStatus,
  TourMatrix,
  TourinfoMaster,
  TourRow,
} from "../types/tour.types";
import hereMapService from "./hereMap.service";
import pool from "../config/database";
import {
  // buildUnassignedOrders,
  extractTourStats,
} from "../helpers/dynamicTour.helpers";
import { Order } from "../types/order.types";
import logger from "../config/logger";
import { getWarehouseWithVehicles } from "./warehouse.service";
// import { warehouseOrdersAssignment } from "../orchestration/assignmentWorker.helper";
import {
  approxKmForRoute,
  approxSecForRoute,
} from "../orchestration/utils/orderCluster.util";
import { Warehouse } from "../types/warehouse.types";
import { assignmentHelper } from "../orchestration/assignmentWorker.helper";

export async function getTourMapDataAsync(tourPayload: CreateTour) {
  const connection = await pool.getConnection();

  try {
    const { tour, unassigned } = await hereMapService.CreateTourRouteAsync(
      tourPayload.orderIds,
      tourPayload.warehouseId,
    );
    const routes = await getRouteSegments_mapApi(tour);

    await connection.beginTransaction();

    //Db table updates for tour
    const { tourId, tourName } = await createTourAsync(connection, tourPayload);

    const hereMap_data = JSON.stringify({ tour, unassigned });
    const hereMap_route = JSON.stringify(routes);
    await tourInfo_master.updateHereMapResponse(
      connection,
      tourId,
      hereMap_data,
      hereMap_route,
    );

    await saveRouteSegments(connection, tourId, routes);

    const { unassignedOrderIds } = await updateTourOrdersStatus(
      connection,
      tourId,
      tourPayload.orderIds,
      unassigned,
    );

    await connection.commit();

    // Prepare res
    const unassignedOrders =
      await LogisticOrder.getOrdersByIds(unassignedOrderIds);
    const notAssigned: NotAssigned[] = unassigned.map((u) => {
      const id = u.jobId.split("_")[1];
      const matchedOrder = unassignedOrders.find(
        (order) => order.order_id === Number(id),
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
  unassigned: Unassigned[],
) {
  const unassignedOrderIds: number[] =
    await extractUnassignedOrderIds(unassigned);

  if (unassignedOrderIds.length > 0) {
    console.log(`Removing ${unassignedOrderIds.length} unassigned order(s)`);

    await removeUnassignedOrdersFromTour(conn, tourId, unassignedOrderIds);

    const updated = await LogisticOrder.updateSysOrdersStatus(
      conn,
      unassignedOrderIds,
      OrderStatus.Unassigned,
    );
    console.log("Updated status for unassigned orders:", updated);
  }

  const assignedOrderIds = orderIds.filter(
    (id) => !unassignedOrderIds.includes(id),
  );

  const assignedOrders_upadted = await LogisticOrder.updateSysOrdersStatus(
    conn,
    assignedOrderIds,
    OrderStatus.Assigned,
  );
  console.log(`Update status assigned orders: `, assignedOrders_upadted);

  return { unassignedOrderIds };
}

export async function saveRouteSegments(
  conn: PoolConnection,
  tourId: number,
  routes: LogisticsRoute[],
): Promise<LogisticsRoute[]> {
  try {
    // const routes = await getRouteSegments_mapApi(tour);

    // Save route segments
    for (const segment of routes) {
      const segmentJson = JSON.stringify(segment);
      const orderId = segment.order_id;
      console.log(
        `Saving Route Segment for Tour Id: ${tourId} Order Id: ${orderId}`,
      );

      if (!orderId)
        throw new Error(
          `Segment has invalid order_id: ${JSON.stringify(segment)}`,
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
  tour: Tour,
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
    const routes: DecodedRoute | null =
      await hereMapService.getRoutesForTour(subTour);

    if (!routes) throw new Error("Failsed to decode routes");

    console.log(
      `Route Segment created for Order Id ${destination.activities[0].jobId}`,
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
  const tourObj: TourinfoMaster =
    await tourInfo_master.getTourByIdAsync(tourId);
  const matrix = await getTourMatrix(5, TourType.dynamicTour);
  tourObj.matrix = matrix;

  const orderIds = tourObj.orderIds.split(",").map(Number);
  const orders = await LogisticOrder.getOrdersWithItemsAsync(orderIds);
  // const orders = await LogisticOrder.getOrdersByIds(orderIds);
  // const orders = await LogisticOrder.getOrdersByTourId(tourId);

  // load order items

  tourObj.orders = orders;

  // const tourObj = await tourInfo_master.getTourNameByIdAsync(tourId);
  // const routes = await route_segments.getAllRouteSegments_TourId(tourId);

  // return { tour: tourObj.tour_name, routes, unassigned: "400098044,400098044" };
  return tourObj;
}

function summarizeOrders(orders: Order[]) {
  let totalWeightKg = 0;
  let totalSLMDQty = 0;
  let totalArticles = 0;

  for (const order of orders) {
    totalWeightKg += order.weight_kg ?? 0;
    // totalSLMDQty += order.orderItemsCount ?? 0;
    totalArticles += order.article_sku
      ? order.article_sku.split(",").length
      : 0;
  }

  totalSLMDQty = orders.reduce((count, order) => {
    const items =
      order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    return count + items;
  }, 0);

  return { totalWeightKg, totalSLMDQty, totalArticles };
}

async function computeTourCost(
  orders: Order[],
  totalDistanceKm: number,
  totalDurationHrs: number,
  conn?: PoolConnection,
  twoDayTour: Boolean = false,
): Promise<TourMatrix> {
  const connection = conn ?? pool;
  const [ratesRows]: any = await connection.execute(`
  SELECT * FROM delivery_cost_rates
  ORDER BY id DESC
  LIMIT 1
  `);

  const row = ratesRows[0];
  const rates: DeliveryCostRates = {
    currency_code: row.currency_code,
    personnel_costs_per_hour: row.personnel_costs_per_hour,
    diesel_costs_per_liter: row.diesel_costs_per_liter,
    consumption_l_per_100km: row.consumption_l_per_100km,
    van_costs_per_day: row.van_costs_per_day,

    storage_cost_per_BKW: row.storage_cost_per_BKW,
    bkw_per_tour: row.bkw_per_tour,
    avg_tour_duration_hrs: row.avg_tour_duration_hrs,
    avg_tour_length_km: row.avg_tour_length_km,
    avg_number_tour_days: row.avg_number_tour_days,

    hotel_costs: row.hotel_costs,
    WA: row.WA,
    WE: row.WE,
    infeed: row.infeed,
    panels_per_pallet: row.panels_per_pallet,
  };
  if (!rates) {
    logger.warn("[Tour Cost] No cost rates found — returning default zeros");
    return {
      hotelCost: 0,
      vanTourCost: 0,
      dieselTourCost: 0,
      personnelTourCost: 0,
      totalCost: 0,
      costPerStop: 0,
      costPerArticle: 0,
      costPerSLMD: 0,
      totalWeightKg: 0,
    } as TourMatrix;
  }

  const { totalWeightKg, totalSLMDQty, totalArticles } =
    summarizeOrders(orders);

  const tour_infeed = rates.infeed * totalSLMDQty;
  const tour_we = rates.WE * totalSLMDQty;
  const tour_wa = rates.WA;

  const personnelCost = rates.personnel_costs_per_hour * totalDurationHrs;
  const dieselCost =
    (rates.diesel_costs_per_liter *
      rates.consumption_l_per_100km *
      totalDistanceKm) /
    100;
  const vanCost = rates.van_costs_per_day;
  const warehouseCost = 0;
  const hotelCost = twoDayTour ? rates.hotel_costs : 0;

  const totalCost: number =
    +vanCost +
    +dieselCost +
    +personnelCost +
    +warehouseCost +
    +tour_infeed +
    +tour_we +
    +tour_wa +
    +hotelCost;

  const costPerStop = orders.length ? totalCost / orders.length : 0;
  const costPerArticle = totalArticles ? totalCost / totalArticles : 0;
  const costPerSlmd = totalSLMDQty ? totalCost / totalSLMDQty : 0;

  return {
    infeedTourCost: tour_infeed,
    costWE: tour_we,
    costWA: tour_wa,
    hotelCost,
    vanTourCost: vanCost,
    dieselTourCost: dieselCost,
    personnelTourCost: personnelCost,
    totalCost,
    costPerStop,
    costPerArticle,
    costPerSLMD: costPerSlmd,
    totalWeightKg,
  } as TourMatrix;
}

export async function persistTourCostMatrixAsync(
  tourId: number,
  type: TourType = TourType.dynamicTour,
): Promise<TourMatrix> {
  logger.info("[Tour Cost] Beginning...");

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Getting Tour Data
    let tourData: any;
    if (type === TourType.dynamicTour) {
      const [rows]: any = await connection.execute(
        `SELECT orderIds, tour_name, tour_data FROM dynamic_tours WHERE id = ?`,
        [tourId],
      );
      tourData = rows[0];
    } else {
      const [rows]: any = await connection.execute(
        `SELECT order_ids AS orderIds, tour_name, tour_data FROM tourinfo_master WHERE id = ?`,
        [tourId],
      );
      tourData = rows[0];
    }
    if (!tourData) throw new Error(`Tour ${tourId} not found`);
    logger.info(`[Tour Cost] Calculating cost for tour: ${tourData.tour_name}`);

    const tourObj = tourData.tour_data;
    const tour = tourObj.tour as Tour;
    const { totalDistanceKm, totalDurationHrs } = extractTourStats(tour);

    // Compute totals
    const ordersWithItems: Order[] =
      await LogisticOrder.getOrdersWithItemsAsync(
        tourData.orderIds.split(",").map(Number),
      );

    const {
      infeedTourCost,
      costWE,
      costWA,
      hotelCost,
      vanTourCost,
      dieselTourCost,
      personnelTourCost,
      totalCost,
      costPerStop,
      costPerArticle,
      costPerSLMD,
      totalWeightKg,
    }: TourMatrix = await computeTourCost(
      ordersWithItems,
      totalDistanceKm,
      totalDurationHrs,
      connection,
    );

    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";
    const [matrixRows]: any = await connection.execute(
      `SELECT * FROM delivery_cost_per_tour WHERE ${idColumn} = ?`,
      [tourId],
    );
    const isExist = matrixRows[0];

    // Insert or update
    let query_matrix = "";
    let params: any[] = [];

    if (!isExist) {
      query_matrix = `
        INSERT INTO delivery_cost_per_tour (
          ${idColumn}, infeed_tour_cost, we_tour_cost, wa_tour_cost, hotel_cost, van_tour_cost, diesel_tour_cost,
          personnel_tour_cost, total_cost,
          delivery_cost_per_stop, delivery_cost_per_bkw, delivery_cost_per_slmd,
          total_distance_km, total_duration_hrs, total_weight_kg,
          warehouse_tour_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      params = [
        tourId,
        infeedTourCost,
        costWE,
        costWA,
        hotelCost,
        vanTourCost,
        dieselTourCost,
        personnelTourCost,
        totalCost,
        costPerStop,
        costPerArticle,
        costPerSLMD,
        totalDistanceKm,
        totalDurationHrs,
        totalWeightKg,
      ];
    } else {
      query_matrix = `
        UPDATE delivery_cost_per_tour
        SET 
            infeed_tour_cost = ?,
            we_tour_cost = ?,
            wa_tour_cost = ?,
            hotel_cost = ?,
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
        infeedTourCost,
        costWE,
        costWA,
        hotelCost,
        vanTourCost,
        dieselTourCost,
        personnelTourCost,
        totalCost,
        costPerStop,
        costPerArticle,
        costPerSLMD,
        totalDistanceKm,
        totalDurationHrs,
        totalWeightKg,
        tourId,
      ];
    }

    const [result] = await connection.execute<ResultSetHeader>(
      query_matrix,
      params,
    );

    const targetId = isExist ? isExist.id : result.insertId;
    console.info(isExist ? "Tour cost UPDATED: " : "Tour cost CREATED: ", {
      targetId,
    });

    await connection.commit();
    const tourMatrix = await getTourMatrix(tourId, type);
    logger.info(
      `[Tour Cost] Calculated cost for tour ${tourData.tour_name} is ${tourMatrix.totalCost}`,
    );

    return tourMatrix;
  } catch (error) {
    await connection.rollback();
    logger.error("[Tour Cost] Error creating delivery cost for tour:", error);
    throw error;
  } finally {
    logger.info("[Tour Cost] Terminating...");
    connection.release();
  }
}

export async function tourCostRecompute() {
  const [rows]: any = await pool.execute(
    `SELECT id FROM dynamic_tours WHERE approved_by IS NULL`,
  );
  const tourIds = rows.map((r: any) => r.id);

  for (const id of tourIds) {
    await persistTourCostMatrixAsync(id);
  }

  // await Promise.all(tourIds.map((id: number) => persistTourCostMatrixAsync(id)));
}

export async function getTourMatrix(
  tourId: number,
  type: TourType = TourType.dynamicTour,
): Promise<TourMatrix> {
  try {
    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";

    const [rows]: any = await pool.execute(
      `SELECT * FROM delivery_cost_per_tour  WHERE ${idColumn} = ?`,
      [tourId],
    );
    if (!rows || rows.length === 0) {
      throw new Error(`Tour matrix not found for tourId ${tourId}`);
    }

    const row = rows[0];
    const matrix: TourMatrix = {
      tourId,
      totalWeightKg: row.total_weight_kg,
      totalDistanceKm: row.total_distance_km,
      totalDurationHrs: row.total_duration_hrs,
      costPerStop: row.delivery_cost_per_stop,
      costPerArticle: row.delivery_cost_per_bkw,
      costPerSLMD: row.delivery_cost_per_slmd,
      totalCost: row.total_cost,
      hotelCost: row.hotel_cost,
      vanTourCost: row.van_tour_cost,
      dieselTourCost: row.diesel_tour_cost,
      personnelTourCost: row.personnel_tour_cost,
      warehouseTourCost: row.warehouse_tour_cost,
      infeedTourCost: row.infeed_tour_cost,
      costWE: row.we_tour_cost,
      costWA: row.wa_tour_cost,
    };

    const tourQuery =
      type === TourType.dynamicTour
        ? `SELECT orderIds FROM dynamic_tours WHERE id = ?`
        : `SELECT order_ids AS orderIds FROM tourinfo_master WHERE id = ?`;
    const [tourRows]: any = await pool.execute(tourQuery, [tourId]);
    if (!tourRows || tourRows.length === 0) {
      throw new Error(`No tour found for id ${tourId}`);
    }

    const order_ids = tourRows[0].orderIds.split(",");

    matrix.totalOrdersItemsQty =
      await LogisticOrder.getOrderItemsCount(order_ids);
    matrix.totalOrdersArticlesQty =
      await LogisticOrder.getOrderArticlesCount(order_ids);

    return matrix;
  } catch (error) {
    logger.error(`Error fetching Tour Matrix for tour Id: ${tourId}:`, error);
    throw error;
  }
}

export async function estimateTourCostMatrixAsync(
  warehouseId: number,
  orderIds: number[],
): Promise<TourMatrix | undefined> {
  const orders = await LogisticOrder.getOrdersWithItemsAsync(orderIds);
  const warehouse: Warehouse = await getWarehouseWithVehicles(warehouseId);

  // const assignments: Map<number, { order: Order; distance?: number }[]> =
  //   await warehouseOrdersAssignment([warehouse], orders);

  // // const inLine_Orders = Array.from(assignments.values())
  // //   .flat()
  // //   .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  // //   .map((item) => item.order);

  // const {
  //   tour,
  //   unassigned,
  //   orders: txnOrders,
  // } = await hereMapService.CreateTourRouteAsync(
  //   inLine_Orders.map((o) => o.order_id),
  //   warehouse.id
  // );

  // if (unassigned.length > 0) {
  //   const unassignedOrders = buildUnassignedOrders(unassigned, txnOrders);

  //   const nonTxnOrders = unassignedOrders.map((u) => u.order_number).join(", ");
  //   const msg = `${unassignedOrders[0].reasons}.
  //   Order(s): ${nonTxnOrders}`;
  //   throw new Error(msg);
  //   // return {
  //   //   success: false,
  //   //   message: msg,
  //   //   totalCost: null,
  //   //   costPerStop: null,
  //   //   costPerArticle: null,
  //   //   costPerSLMD: null,
  //   //   totalWeightKg: null,
  //   //   totalDistanceKm: null,
  //   //   totalDurationHrs: null,
  //   // } as unknown as TourMatrix;
  // }
  // const { totalDistanceKm, totalDurationHrs } = extractTourStats(tour);

  const helper = assignmentHelper(warehouse);
  const { geoClusters, leftovers } =
    helper.clusterOrdersByDensDirection(orders);
  console.log("Leftovers from orders route: ", leftovers);
  const xOrders = geoClusters.flatMap((c) => c.cluster);
  // const xOrders = [...orders];

  const wh = { lat: warehouse.lat, lng: warehouse.lng };
  const totalDistanceKm = await approxKmForRoute(wh, xOrders);
  const approxSecs = await approxSecForRoute(wh, xOrders);
  const totalDurationHrs = approxSecs / 3600;

  const {
    totalCost,
    costPerStop,
    costPerArticle,
    costPerSLMD,
    totalWeightKg,
  }: TourMatrix = await computeTourCost(
    orders,
    totalDistanceKm,
    totalDurationHrs,
  );

  console.log(`
    estimateTourCostMatrixAsync: \n
    {
    totalCost: ${totalCost},\n
    costPerStop: ${costPerStop},\n
    costPerArticle: ${costPerArticle},\n
    costPerSLMD: ${costPerSLMD},\n
    totalWeightKg: ${totalWeightKg},\n
    totalDistanceKm: ${totalDistanceKm},\n
    totalDurationHrs: ${totalDurationHrs}\n
  }
  `);

  return {
    totalCost,
    costPerStop,
    costPerArticle,
    costPerSLMD,
    totalDurationHrs,
    totalDistanceKm,
    totalWeightKg,
  } as TourMatrix;

  // return undefined;
}

export async function removeTourMatrix(
  tourId: number,
  type: TourType = TourType.dynamicTour,
): Promise<boolean> {
  try {
    const idColumn =
      type === TourType.masterTour ? "tour_id" : "dynamic_tour_id";

    // First, verify if the matrix exists
    const [rows]: any = await pool.execute(
      `SELECT id FROM delivery_cost_per_tour WHERE ${idColumn} = ?`,
      [tourId],
    );

    if (!rows || rows.length === 0) {
      throw new Error(
        `No tour matrix found for tourId ${tourId} [Tour Type: ${type}]`,
      );
    }

    // Proceed with deletion
    const [result]: any = await pool.execute(
      `DELETE FROM delivery_cost_per_tour WHERE ${idColumn} = ?`,
      [tourId],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Failed to delete tour matrix for tourId ${tourId}`);
    }

    logger.info(`Tour matrix deleted successfully for tourId ${tourId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting Tour Matrix for tourId ${tourId}:`, error);
    throw error;
  }
}

export async function getToursByStatusAsync(
  status: TourStatus,
): Promise<TourRow[]> {
  const [rows]: any = await pool.execute(
    `SELECT 
      t.*, d.name AS driver_name, d.id AS driver_id, wh.color_code
      FROM tourinfo_master AS t
    JOIN tour_driver AS td 
        ON t.id = td.tour_id AND t.driver_id = td.driver_id
    JOIN driver_details AS d 
        ON td.driver_id = d.id
    JOIN warehouse_details AS wh 
        ON t.warehouse_id = wh.warehouse_id 
    WHERE tour_status = ?`,
    [status],
  );

  // TourRow type mapping
  const tourRows = rows.map((row: any) => ({
    id: row.id,
    tour_name: row.tour_name,
    tour_comments: row.tour_comments,
    tour_date: row.tour_date,
    tour_status: row.tour_status,
    route_color: row.route_color,
    driver_id: row.driver_id,
    driver_name: row.driver_name,
    vehicle_id: row.vehicle_id,
    warehouse_id: row.warehouse_id,
    warehouse_colorCode: row.color_code,
  }));
  return tourRows;
}
