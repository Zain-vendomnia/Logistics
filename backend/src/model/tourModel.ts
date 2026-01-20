import { ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { CreateTour } from "../types/dto.types";
import { logWithTime } from "../utils/logging";
import { PoolConnection } from "mysql2/promise";
import { TourinfoMaster, UpdateTour_Req } from "../types/tour.types";
import { OrderStatus } from "./LogisticOrders";
import { updateOrderStatus } from "../services/logisticOrder.service";
import { mapRowToTour } from "../helpers/tour.helper";
import { tourInfo_master } from "./TourinfoMaster";

export const createTourAsync = async (
  connection: PoolConnection,
  tour: CreateTour,
) => {
  logWithTime("[Create Tour Initiated]");
  try {
    // 1. Get Driver: name, userId, active status
    const [driverUserRows]: any = await connection.execute(
      `SELECT u.is_active, d.name
      FROM driver_details d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.id = ?`,
      [tour.driverId],
    );

    if (!driverUserRows.length)
      throw new Error(`Driver not found with ID ${tour.driverId}`);

    const { is_active, name: driverName } = driverUserRows[0];
    if (is_active === 0) throw new Error("Driver is inactive");

    // 2. Check if driver also has a tour on same day
    const [duplicateTourRows]: any = await connection.execute(
      `SELECT COUNT(*) AS count FROM tourinfo_master
      WHERE driver_id = ? AND tour_date = ?`,
      [tour.driverId, tour.tourDate],
    );
    if (duplicateTourRows[0].count > 0)
      throw new Error(`Driver already has a tour on ${tour.tourDate}`);

    // 3. Validate order IDs
    if (!Array.isArray(tour.orderIds) || tour.orderIds.length === 0)
      throw new Error("No order IDs provided for this tour.");

    // 4. Generate tour name
    const tourName = await generateTourName(
      connection,
      tour,
      driverName as string,
    );

    // 5. Insert into tourinfo_master
    const insertSql = `
    INSERT INTO tourinfo_master (
      tour_name, comments, start_time, driver_id, route_color, tour_date, order_ids, warehouse_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
  `;
    const insertValues = [
      tourName,
      tour.comments || `Creating Tour at ${new Date().toISOString()}`,
      tour.startTime,
      tour.driverId,
      tour.routeColor,
      tour.tourDate,
      JSON.stringify(tour.orderIds),
      tour.warehouseId,
      tour.userId,
    ];

    console.log("[tourModel] Creating tour with values:", insertValues);

    const [result] = await connection.execute(insertSql, insertValues);
    const resultSet = result as ResultSetHeader;

    if (resultSet.insertId) {
      await insertTourDriverData(connection, {
        tour_id: resultSet.insertId,
        driver_id: tour.driverId,
        tour_date: tour.tourDate,
      });
    }

    return { tourId: resultSet.insertId, tourName: tourName };
  } catch (err: unknown) {
    console.error("[tourModel] Error creating tour:", err);
    const message = err instanceof Error ? err.message : new Error(String(err));
    throw new Error(`[tourModel] Failed: ${message}`);
  }
};

async function generateTourName(
  conn: PoolConnection,
  tour: CreateTour,
  driverName: string,
) {
  let tour_name = "";

  if (!tour.dTour_name) {
    const orderPlaceholders = tour.orderIds.map(() => "?").join(",");
    const [zipRows]: any = await conn.query(
      `SELECT zipcode FROM logistic_order WHERE order_id IN (${orderPlaceholders})`,
      tour.orderIds,
    );
    if (!zipRows.length) throw new Error(`No valid orders found`);

    const zipcodes: string[] = zipRows.map((r: any) => String(r.zipcode));

    const zipcodePrefixes = Array.from(
      new Set(zipcodes.map((z) => z.substring(0, 2) || "00")),
    );

    tour_name = `PLZ-${zipcodePrefixes}`;
  } else {
    tour_name = tour.dTour_name;
  }

  const tourDateFormatted = new Date(tour.tourDate);
  const dayName = tourDateFormatted.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const formattedDate = `${tourDateFormatted.getFullYear()}.${String(
    tourDateFormatted.getMonth() + 1,
  ).padStart(2, "0")}.${String(tourDateFormatted.getDate()).padStart(2, "0")}`;

  const driver_name = driverName.replace(/\s+/g, "").toLowerCase();

  tour_name += `-${driver_name}-${dayName}-${formattedDate}`;

  return tour_name;
}

// Function to insert a tour_driver data into the database
export const insertTourDriverData = async (conn: PoolConnection, tour: any) => {
  const sql = `
    INSERT INTO tour_driver (tour_id, driver_id, tour_date)
    VALUES (?, ?, ?)
  `;

  const values = [tour.tour_id, tour.driver_id, tour.tour_date];

  try {
    console.log("[tour_driver] Creating tour_driver entry:", values);
    const [result] = await conn.query(sql, values);
    console.log("[tour_driver] Entry created successfully");
    return result;
  } catch (err) {
    console.error("[tour_driver] Error inserting tour_driver data:", err);
    throw err;
  }
};

export const deleteTours = async (tourIds: number[]) => {
  const conn = await pool.getConnection();

  try {
    console.log("[tourModel] Deleting tours with IDs:", tourIds);

    await conn.beginTransaction();

    // Step 1: Delete from route_segments explicitly (optional if ON DELETE CASCADE works)
    const deleteSegmentsSql = `
      DELETE FROM route_segments
      WHERE tour_id IN (?)
    `;
    await conn.query(deleteSegmentsSql, [tourIds]);

    // Step 2: Delete from tourinfo_master
    const deleteToursSql = `
      DELETE FROM tourinfo_master 
      WHERE id IN (?)
    `;
    const [result] = await conn.query(deleteToursSql, [tourIds]);

    // Step 3: Delete from tour_driver table

    const deletetour_driver_Sql = `
    DELETE FROM tour_driver 
    WHERE tour_id IN (?)
  `;
    await conn.query(deletetour_driver_Sql, [tourIds]);

    await conn.commit();

    console.log(
      "[tourModel] Tours,route and tour_driver segments deleted successfully",
    );
    return result;
  } catch (err) {
    await conn.rollback();
    console.error("[tourModel] Error deleting tours:", err);
    throw err;
  } finally {
    conn.release();
  }
};

export const updateTourinfoMasterAsync = async (
  tourData: UpdateTour_Req,
): Promise<TourinfoMaster> => {
  if (!tourData.orderIds?.length) {
    throw new Error("Tour must contain at least one order.");
  }

  const checkPendingSql = `
    SELECT COUNT(*) AS count FROM tourinfo_master
    WHERE driver_id = ? AND tour_status IN ('pending', 'in-progress') AND id != ?
  `;

  const checkDateSql = `
    SELECT COUNT(*) AS count FROM tourinfo_master
    WHERE driver_id = ? AND tour_date = ? AND id != ?
  `;

  const getUserIdSql = `
    SELECT user_id FROM driver_details WHERE id = ?
  `;

  const checkUserStatusSql = `
    SELECT is_active FROM users WHERE user_id = ?
  `;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tourRow] = await connection.query(
      `SELECT * FROM tourinfo_master WHERE id = ? FOR UPDATE`,
      [tourData.id],
    );

    const dbTour = (tourRow as any[]).map(mapRowToTour)[0];

    // 1. Check for existing pending/in-progress tours
    const [pendingRows]: any = await connection.execute(checkPendingSql, [
      tourData.driverId,
      tourData.id,
    ]);
    if (pendingRows[0].count > 0) {
      throw new Error(
        `Driver already has another pending or in-progress tour.`,
      );
    }

    // 2. Check for another tour on the same date
    const [dateRows]: any = await connection.execute(checkDateSql, [
      tourData.driverId,
      tourData.tourDate,
      tourData.id,
    ]);
    if (dateRows[0].count > 0) {
      throw new Error(
        `Driver already has another tour on ${tourData.tourDate}.`,
      );
    }

    // 3. Check driver status
    const [userRows]: any = await connection.execute(getUserIdSql, [
      tourData.driverId,
    ]);
    if (!userRows.length)
      throw new Error(`Driver not found with ID ${tourData.driverId}`);

    const userId = userRows[0].user_id;
    const [statusRows]: any = await connection.execute(checkUserStatusSql, [
      userId,
    ]);
    if (!statusRows.length || statusRows[0].is_active === 0) {
      throw new Error(`Driver is inactive.`);
    }

    // 4. Update tourinfo_master - OrderIds
    const dbTourDate = dbTour.tour_date.toISOString().split("T")[0];
    const dbStartTime = dbTour.start_time?.slice(0, 5);
    const is_driverId_changed = dbTour.driver_id !== tourData.driverId;

    const newOrderIds = tourData.orderIds.map(String);
    const dbOrderIds = dbTour.orderIds.split(",");
    const orderIdsDiffer =
      [...dbOrderIds].sort().join(",") !== [...newOrderIds].sort().join(",");

    const queryFields: string[] = [];
    const updateValues: any[] = [];

    if (dbTourDate !== tourData.tourDate) {
      queryFields.push("tour_date = ?");
      updateValues.push(tourData.tourDate);
    }

    if (dbStartTime !== tourData.startTime) {
      queryFields.push("start_time = ?");
      updateValues.push(`${tourData.startTime}:00`);
    }

    if (dbTour.route_color !== tourData.routeColor) {
      queryFields.push("route_color = ?");
      updateValues.push(tourData.routeColor);
    }

    if (is_driverId_changed) {
      queryFields.push("driver_id = ?");
      updateValues.push(tourData.driverId);
    }

    if (dbTour.vehicle_id !== tourData.vehicleId) {
      queryFields.push("vehicle_id = ?");
      updateValues.push(tourData.vehicleId);
    }

    if (orderIdsDiffer) {
      queryFields.push("order_ids = ?");
      updateValues.push(newOrderIds.join(","));
    }

    if (queryFields.length > 0) {
      queryFields.push("updated_by = ?");
      updateValues.push(tourData.userId);

      updateValues.push(tourData.id);

      await connection.execute(
        `
    UPDATE tourinfo_master
    SET ${queryFields.join(", ")}
    WHERE id = ?
    `,
        updateValues,
      );
    }

    // 5. Update tour_driver
    if (is_driverId_changed) {
      const updateDriverQuery = `
      UPDATE tour_driver 
      SET driver_id = ?, tour_date = ?
      WHERE tour_id = ?
    `;
      await connection.execute(updateDriverQuery, [
        tourData.driverId,
        tourData.tourDate,
        tourData.id,
      ]);
    }

    if (orderIdsDiffer) {
      // update
      // - order_ids - logistic-order.orders.status
      // -  tour-route - route-data   // Pending for Here API activation

      const addedIds = newOrderIds
        .filter((id) => !dbOrderIds.includes(id))
        .map(Number);
      const removedIds = dbOrderIds
        .filter((id) => !newOrderIds.includes(id))
        .map(Number);

      const promises_assigned = addedIds.map((oId) =>
        updateOrderStatus({
          orderId: oId,
          newStatus: OrderStatus.Assigned,
          changedBy: tourData.userId,
          conn: connection,
        }),
      );
      await Promise.all(promises_assigned);

      const promises_unassigned = removedIds.map((oId) =>
        updateOrderStatus({
          orderId: oId,
          newStatus: OrderStatus.Unassigned,
          changedBy: tourData.userId,
          conn: connection,
        }),
      );
      await Promise.all(promises_unassigned);
    }

    await connection.commit();

    const updatedTour = await tourInfo_master.getTourByIdAsync(tourData.id);
    return updatedTour;
  } catch (error: unknown) {
    await connection.rollback();

    if (error instanceof Error) {
      console.error("[updateTour] Error:", error.message);
      throw error;
    } else {
      console.error("[updateTour] Unknown error:", error);
      throw new Error("An unknown error occurred while updating the tour.");
    }
  } finally {
    connection.release();
  }
};

export const removeUnassignedOrdersFromTour = async (
  conn: PoolConnection,
  tourId: number,
  orderIdsToRemove: number[],
) => {
  const [rows]: any = await conn.query(
    `SELECT order_ids FROM tourinfo_master WHERE id = ?`,
    [tourId],
  );

  if (!rows.length) throw new Error(`Tour with id ${tourId} not found`);

  console.log("Order_Ids from tourinfo_master");
  const orderIds_row = rows[0].order_ids;
  console.log(orderIds_row);

  let currentOrderIds: number[];

  try {
    currentOrderIds = orderIds_row.map(Number);
  } catch (error) {
    console.log("Failed to parse order_ids:", orderIds_row, error);
    throw error;
  }

  // Filter order Ids
  const updatedOrderIds = currentOrderIds.filter(
    (id) => !orderIdsToRemove.includes(id),
  );

  await conn.query(`UPDATE tourinfo_master SET order_ids = ? WHERE id = ?`, [
    JSON.stringify(updatedOrderIds),
    tourId,
  ]);

  console.log(
    `Removed ${orderIdsToRemove.length} order(s) from Tour ${tourId}. Remaing order: `,
    updatedOrderIds,
  );
};
