import pool from "../database";
import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
  OrderStatus,
} from "../model/LogisticOrders";
import {
  CreateTour,
  DynamicTourPayload,
  DynamicTourRes,
  rejectDynamicTour_Req,
  UnassignedRes,
} from "../types/dto.types";
import { DecodedRoute } from "../types/hereMap.types";
import { logWithTime } from "../utils/logging";
import hereMapService from "./hereMap.service";

import { createTourAsync } from "../model/tourModel";
import { tourInfo_master } from "../model/TourinfoMaster";
import { getRouteSegments_mapApi, saveRouteSegments } from "./tour.service";
import { PoolConnection } from "mysql2/promise";
import { TourStatus, TourTracePayload, TourType } from "../types/tour.types";

async function generateTourNumber(orderIds: number[]): Promise<string> {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const zipcodePrefixes = Array.from(
    new Set(orders.map((o) => o.zipcode?.substring(0, 2) || "00"))
  );

  const zipcodeString = zipcodePrefixes.join("-");
  return `PLZ-${zipcodeString}`;
}

export async function createDynamicTourAsync(payload: DynamicTourPayload) {
  const connection = await pool.getConnection();

  logWithTime(`[Create Dynamic Tour]:", ${payload}`);

  if (!payload || !payload.orderIds || !payload.warehouse_id) {
    throw new Error(
      "Missing required tour data. Operation cannot be performed."
    );
  }
  try {
    const orderIds = payload.orderIds.split(",").map((o) => Number(o));

    const { tour, unassigned, orders } =
      await hereMapService.CreateTourRouteAsync(orderIds, payload.warehouse_id);
    console.log(tour, unassigned);

    const routes: DecodedRoute | null = await hereMapService.getRoutesForTour(
      tour
    );

    const xOrderIds = hereMapService.extractTourOrderIds(tour);

    await connection.beginTransaction();

    if (routes) {
      const dynamicTour: DynamicTourPayload = {
        ...payload,
        tour_data: { tour, unassigned },
        // tour_data: JSON.stringify({ tour, unassigned }),
        tour_route: routes,
        orderIds: xOrderIds,
      };

      await saveDynamicTour(connection, dynamicTour);

      const xOrder_ids: number[] = xOrderIds.split(",").map((o) => Number(o));
      await LogisticOrder.updateOrdersStatus(
        connection,
        xOrder_ids,
        OrderStatus.assigned
      );
    } else {
      logWithTime(`Null Response from Here Map - Routes creation`);
      throw Error("Null Response from Here Map - Routes creation");
    }

    const order_number_map = new Map<number, string>(
      orders.map((o) => [o.order_id, o.order_number])
    );
    const unassignedOrders: UnassignedRes[] = unassigned.map((unassigned) => {
      const order_id = Number(unassigned.jobId.split("_")[1]);
      return {
        orderId: order_id,
        order_number: order_number_map.get(order_id) ?? "",
        reasons: unassigned.reasons.map((r) => `${r.code}:${r.description}`),
      };
    });

    const response: DynamicTourRes = {
      tour: tour,
      unassigned: unassignedOrders,
      dynamicTour: {
        ...payload,
        orderIds: xOrderIds,
        tour_route: routes,
      },
    };

    return response;
  } catch (error) {
    connection.rollback();
  } finally {
    connection.release();
  }
}

const saveDynamicTour = async (
  conn: PoolConnection,
  payload: DynamicTourPayload
) => {
  const {
    id,
    tour_name,
    tour_route,
    tour_data,
    orderIds,
    warehouse_id,
    approved_by = null,
    approved_at = null,
    updated_by = null,
  } = payload;

  const isNew = !id && !tour_name;
  if (isNew) {
    // Create new
    const order_ids = orderIds.split(",").map((o) => Number(o));
    const new_tourNumber = await generateTourNumber(order_ids);

    const query = `
      INSERT INTO dynamic_tours (
        tour_name, tour_route, tour_data, orderIds, warehouse_id, approved_by, approved_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      new_tourNumber,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data),
      orderIds,
      warehouse_id,
      approved_by,
      approved_at,
      updated_by,
    ];

    try {
      const [result]: any = await conn.execute(query, values);
      return { ...result, id: result.insertId, tour_number: new_tourNumber };
    } catch (error) {
      console.error("Error inserting dynamic tour:", error);
      throw error;
    }
  } else {
    // Update existing
    const query = `
      UPDATE dynamic_tours
      SET
      tour_name = ?,
        tour_route = ?,
        tour_data = ?,
        orderIds = ?,
        approved_by = ?,
        approved_at = ?,
        updated_by = ?
      WHERE ${id ? "id = ?" : "tour_name = ?"}
    `;

    const values = [
      tour_name,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data ?? {}),
      orderIds,
      approved_by,
      approved_at,
      updated_by,
      id || tour_name,
    ];

    try {
      const [result] = await conn.execute(query, values);
      return result;
    } catch (error) {
      console.error("Error updating dynamic tour:", error);
      throw error;
    }
  }
};

// export async function getDynamicToursAsync()
export async function getUnapprovedDynamicTours(): Promise<
  DynamicTourPayload[]
> {
  const query = `
  SELECT dt.*, wh.warehouse_name, wh.color_code AS warehouse_colorCode
  FROM dynamic_tours AS dt
  JOIN warehouse_details AS wh 
    ON dt.warehouse_id = wh.warehouse_id
  WHERE approved_at IS NULL`;
  // "SELECT id, tour_name, tour_route, orderIds, warehouse_id FROM dynamic_tours WHERE approved_at IS NULL";

  try {
    const [rows] = await pool.execute(query);

    const dTours = (rows as DynamicTourPayload[]).map((row) => ({
      id: row.id,
      tour_name: row.tour_name,
      tour_route:
        typeof row.tour_route === "string"
          ? JSON.parse(row.tour_route)
          : row.tour_route,
      orderIds: row.orderIds,
      totalOrdersItemsQty: 0,
      warehouse_id: row.warehouse_id,
      warehouse_name: row.warehouse_name,
      warehouse_colorCode: row.warehouse_colorCode,
      created_at: row.created_at,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
    }));

    for (const tour of dTours) {
      const order_ids = tour.orderIds.split(",");
      tour.totalOrdersItemsQty = await LogisticOrder.getOrderItemsCount(
        order_ids
      );
    }

    return dTours;
  } catch (error) {
    console.error("Error fetching unapproved dynamic tours:", error);
    throw error;
  }
}

export async function getDynamicTour(
  dTourId: number
): Promise<DynamicTourPayload | null> {
  const query = `SELECT * FROM dynamic_tours WHERE id = ?`;

  try {
    const [rows] = await pool.execute(query, [dTourId]);
    const data = (rows as DynamicTourPayload[])[0];
    return data || null;
  } catch (error) {
    console.error("Dynamic tour not found:", error);
    throw error;
  }
}

export async function acceptDynamicTourAsync(
  tourPayload: CreateTour
): Promise<{ tourName: string }> {
  const connection = await pool.getConnection();

  try {
    if (!tourPayload.dTour_id) {
      throw new Error("Dynamic tour not found.");
    }

    const dTour = await getDynamicTour(tourPayload.dTour_id);
    if (!dTour?.tour_data) throw new Error("Dynamic tour not found.");

    // const { tour } = JSON.parse(dTour.tour_data!.toString());
    const { tour } = dTour.tour_data!;
    const routes = await getRouteSegments_mapApi(tour);

    await connection.beginTransaction();

    tourPayload.orderIds = dTour.orderIds.split(",").map((o) => Number(o));
    tourPayload.dTour_name = dTour.tour_name;
    const { tourId, tourName } = await createTourAsync(connection, tourPayload); //>>

    const hereMapResJson = JSON.stringify(dTour.tour_data);
    await tourInfo_master.updateHereMapResponse(
      connection,
      tourId,
      hereMapResJson
    );

    console.log(`Saving Route Segment for Tour Id: ${tourId} Tour: ${tour}`);
    await saveRouteSegments(connection, tourId, routes);
    console.log(`Saved Route Segments Tour Id: ${tourId} Routes: ${routes}`);

    // db remove
    const trace_data: TourTracePayload = {
      source_table: TourType.dynamicTour,
      status: TourStatus.approved,
      source_id: dTour.id!,
      tour_name: dTour.tour_name!,
      tour_route: dTour.tour_route ?? {},
      tour_data: dTour.tour_data ?? {},
      orderIds: dTour.orderIds,
      warehouse_id: dTour.warehouse_id,
      removed_reason: "Tour Approved",
      removed_by: tourPayload.userId,
    };
    await insertTourTrace(connection, trace_data);

    const remove_query = `DELETE FROM dynamic_tours WHERE id = ?;`;
    await connection.execute(remove_query, [tourPayload.dTour_id]);

    await connection.commit();
    return {
      tourName,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Transaction failed - Tour Ceation:", error);
    throw new Error(`Tour creation failed ${(error as Error).message}`);
  } finally {
    connection.release();
  }
}

export async function rejectDynamicTourAsync(payload: rejectDynamicTour_Req) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const get_query = `SELECT * FROM dynamic_tours WHERE id = ?`;
    const [rows] = await connection.execute(get_query, [payload.tour_id]);
    const dTour = (rows as DynamicTourPayload[])[0];
    if (!dTour) throw new Error("Tour not found");

    const trace_data: TourTracePayload = {
      source_table: TourType.dynamicTour,
      status: TourStatus.rejected,
      source_id: dTour.id!,
      tour_name: dTour.tour_name!,
      tour_route: dTour.tour_route ?? {},
      tour_data: dTour.tour_data ?? {},
      orderIds: dTour.orderIds,
      warehouse_id: dTour.warehouse_id,
      removed_reason: payload.reason,
      removed_by: payload.userId,
    };
    await insertTourTrace(connection, trace_data);

    const remove_query = `DELETE FROM dynamic_tours WHERE id = ?;`;
    const [deleteResult]: any = await connection.execute(remove_query, [
      payload.tour_id,
    ]);

    if (deleteResult.affectedRows === 0) {
      throw new Error("Failed to delete tour");
    }

    // update orders status to unassigned
    const order_ids = dTour.orderIds.split(",").map((o) => Number(o));
    const isUpdated = await LogisticOrder.updateOrdersStatus(
      connection,
      order_ids,
      OrderStatus.unassigned
    );
    console.log("Updated status for unassigned orders:", isUpdated);

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction failed - Tour Rejection:", error);
    throw new Error(`Tour rejection failed: ${(error as Error).message}`);
  } finally {
    connection.release();
  }
}

export async function insertTourTrace(
  conn: PoolConnection,
  payload: TourTracePayload
): Promise<void> {
  const {
    source_table,
    source_id,
    tour_name,
    tour_route,
    tour_data,
    orderIds,
    warehouse_id,
    status,
    removed_reason = null,
    removed_by = null,
  } = payload;

  const query = `
    INSERT INTO tour_traces
    (source_table, source_id, tour_name, tour_route, tour_data, orderIds, warehouse_id, status, removed_reason, removed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    source_table,
    source_id,
    tour_name,
    JSON.stringify(tour_route ?? {}),
    JSON.stringify(tour_data ?? {}),
    orderIds,
    warehouse_id,
    status,
    removed_reason,
    removed_by,
  ];

  await conn.execute(query, values);
  return;
}
