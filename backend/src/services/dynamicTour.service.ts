import pool from "../config/database";
import { PoolConnection } from "mysql2/promise";

import hereMapService from "./hereMap.service";
import {
  persistTourCostMatrixAsync,
  getRouteSegments_mapApi,
  getTourMatrix,
  saveRouteSegments,
  removeTourMatrix,
} from "./tour.service";

import { createTourAsync } from "../model/tourModel";
import { tourInfo_master } from "../model/TourinfoMaster";
import { LogisticOrder, OrderStatus } from "../model/LogisticOrders";
import {
  CreateTour,
  DynamicTourPayload,
  DynamicTourRes,
  rejectDynamicTour_Req,
} from "../types/dto.types";
import {
  TourMatrix,
  TourStatus,
  TourTracePayload,
  TourType,
} from "../types/tour.types";

import {
  buildUnassignedOrders,
  handleExistingTour,
  validatePayload,
} from "../helpers/dynamicTour.helpers";
import logger from "../config/logger";
import { emitNewDynamicTour } from "../socket/tourPlanning.socket";
import { generateTourName } from "../helpers/tour.helper";

export async function createDynamicTourAsync(
  payload: DynamicTourPayload
): Promise<DynamicTourRes> {
  const connection = await pool.getConnection();

  logger.verbose(`[Create Dynamic Tour]: ${payload}`);

  validatePayload(payload);

  const tourName =
    payload.tour_name ??
    (await generateTourName(payload.orderIds.split(",").map((o) => Number(o))));

  try {
    const payload_orderIds = payload.orderIds.split(",").map(Number);

    const { tour, unassigned, orders } =
      await hereMapService.CreateTourRouteAsync(
        payload_orderIds,
        payload.warehouse_id
      );
    logger.info("[Create Dynamic Tour] Tour Created");
    logger.verbose(
      `[Create Dynamic Tour] Map Response: 
      ${[tour, unassigned]}`
    );

    const routes = await hereMapService.getRoutesForTour(tour);
    if (!routes)
      throw new Error("Null Response from Here Map - Routes creation");

    const txnOrderIdsStr = hereMapService.extractTourOrderIds(tour);
    const txnOrder_ids: number[] = txnOrderIdsStr.split(",").map(Number);

    await connection.beginTransaction();

    // In case of update, unassign orders that meant to remove from dTour
    if (payload.id && payload.tour_name) {
      await handleExistingTour(connection, payload, payload_orderIds);
    }

    payload.tour_data = { tour, unassigned };
    payload.tour_route = routes;
    payload.tour_name = tourName;

    const new_dTour = await saveDynamicTour(connection, {
      ...payload,
      orderIds: txnOrderIdsStr,
    });

    // Orders status update
    const orderIds: number[] = new_dTour.orderIds.split(",").map(Number);
    await LogisticOrder.updateSysOrdersStatus(
      connection,
      orderIds,
      OrderStatus.Assigned
    );

    const xOrder_ids = payload_orderIds.filter(
      (o) => !txnOrder_ids.includes(o)
    );
    if (xOrder_ids.length > 0) {
      await LogisticOrder.updateSysOrdersStatus(
        connection,
        xOrder_ids,
        OrderStatus.Unassigned
      );
    }

    await connection.commit();

    const unassignedOrders = buildUnassignedOrders(unassigned, orders);

    let matrix: TourMatrix | null = null;
    try {
      if (!new_dTour?.id) {
        throw new Error(
          "new_dTour.id is undefined, cannot create delivery cost matrix"
        );
      }
      logger.info(
        `[Create Dynamic Tour] New Dynamic Tour ID: ${new_dTour?.id}`
      );

      logger.info("[Create Dynamic Tour] Triggering Delivery Cost...");
      matrix = await persistTourCostMatrixAsync(new_dTour?.id);
    } catch (err) {
      logger.error(
        `[Create Dynamic Tour] Failed to create delivery cost for tour ${new_dTour.id}: ${err}`
      );
    }

    const new_dTour_withMatrix: DynamicTourPayload = {
      ...new_dTour,
      matrix: matrix ?? undefined,
    };

    emitNewDynamicTour(new_dTour_withMatrix);
    // emitNewDynamicTour(new_dTour.tour_name!);

    const response: DynamicTourRes = {
      tour: tour,
      unassigned: unassignedOrders,
      dynamicTour: new_dTour_withMatrix,
    };
    logger.info(
      `Dynamic Tour Created with ID: ${response.dynamicTour?.id ?? "UNKNOWN"} - 
   for warehouse: ${response.dynamicTour?.warehouse_town ?? ""} - ${
        response.dynamicTour?.warehouse_name ?? ""
      } 
   OrdersIds: ${response.dynamicTour?.orderIds ?? ""}`
    );

    return response;
  } catch (error) {
    const err = new Error(
      `[Create Dynamic Tour] failed for tour_name=${payload.tour_name} | OrderIds = ${payload.orderIds}`,
      { cause: error as Error }
    );
    console.error(err);
    try {
      await connection.rollback();
      logger.info(`[Create Dynamic Tour] Rollback succeed.`);
    } catch (rbErr) {
      logger.error(`[Create Dynamic Tour] Rollback failed: ${rbErr}`);
    }
    throw error;
  } finally {
    connection.release();
  }
}

export const saveDynamicTour = async (
  conn: PoolConnection,
  payload: DynamicTourPayload
): Promise<DynamicTourPayload> => {
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

  let query = "";
  let values = [];

  const isNew = !id;
  // const isNew = !id && !tour_name;
  if (isNew) {
    query = `
      INSERT INTO dynamic_tours (
        tour_name, tour_route, tour_data, orderIds, warehouse_id,
        approved_by, approved_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    values = [
      tour_name,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data),
      orderIds,
      warehouse_id,
      approved_by,
      approved_at,
      updated_by,
    ];
  } else {
    // Update existing
    query = `
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

    values = [
      tour_name,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data ?? {}),
      orderIds,
      approved_by,
      approved_at,
      updated_by,
      id || tour_name,
    ];
  }

  try {
    const [result]: any = await conn.execute(query, values);
    logger.info(
      `[Save Dynamic Tour] tour ${
        isNew ? "INSERTED" : "UPDATED"
      } Successfully. \n Dynamic Tour: tour_name = ${
        payload.tour_name
      } | txnOrderIds = ${payload.orderIds}`
    );

    const dtour_Id = isNew ? (result as any).insertId : payload.id;
    const [createdDTour]: any = await conn.execute(
      `SELECT * FROM dynamic_tours WHERE id = ?`,
      [dtour_Id]
    );

    return createdDTour[0];
  } catch (error) {
    logger.error(
      `[Save Dynamic Tour] Error ${
        isNew ? "INSERTING" : "UPDATING"
      } Dynamic Tour: tour_name = ${payload.tour_name} | txnOrderIds = ${
        payload.orderIds
      }, Error: ${error}`
    );
    throw error;
  }
};

// export async function getDynamicToursAsync()
export async function getUnapprovedDynamicTours(): Promise<
  DynamicTourPayload[]
> {
  const query = `
  SELECT dt.*, 
    wh.warehouse_name, 
    wh.color_code AS warehouse_colorCode, 
    wh.town AS warehouse_town
  FROM dynamic_tours AS dt
  JOIN warehouse_details AS wh 
    ON dt.warehouse_id = wh.warehouse_id
  WHERE approved_at IS NULL`;

  try {
    const [rows] = await pool.execute(query);

    const dTours: DynamicTourPayload[] = (rows as DynamicTourPayload[]).map(
      (row) => ({
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
        warehouse_town: row.warehouse_town,
        warehouse_colorCode: row.warehouse_colorCode,
        created_at: row.created_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      })
    );

    for (const tour of dTours) {
      const tourMatrix = await getTourMatrix(tour.id!);
      tour.matrix = tourMatrix;
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
    const tour = (rows as DynamicTourPayload[])[0];
    tour.matrix = await getTourMatrix(tour.id!);

    return tour || null;
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

    const hereMap_data = JSON.stringify(dTour.tour_data);
    const hereMap_route = JSON.stringify(routes);
    await tourInfo_master.updateHereMapResponse(
      connection,
      tourId,
      hereMap_data,
      hereMap_route
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
    const isUpdated = await LogisticOrder.updateSysOrdersStatus(
      connection,
      order_ids,
      OrderStatus.Unassigned
    );
    console.log("Updated status for unassigned orders:", isUpdated);

    await connection.commit();

    removeTourMatrix(payload.tour_id);

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
