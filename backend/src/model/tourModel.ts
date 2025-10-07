import { ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { CreateTour } from "../types/dto.types";
import { logWithTime } from "../utils/logging";
import { PoolConnection } from "mysql2/promise";

export const createTourAsync = async (
  connection: PoolConnection,
  tour: CreateTour
) => {
  logWithTime("[Create Tour Initiated]");
  try {
    // 1. Get Driver: name, userId, active status
    const [driverUserRows]: any = await connection.query(
      `SELECT u.is_active, d.name
      FROM driver_details d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.id = ?`,
      [tour.driverId]
    );

    if (!driverUserRows.length)
      throw new Error(`Driver not found with ID ${tour.driverId}`);

    const { is_active, name: driverName } = driverUserRows[0];
    if (is_active === 0) throw new Error("Driver is inactive");

    // 2. Check if driver also has a tour on same day
    const [duplicateTourRows]: any = await connection.query(
      `SELECT COUNT(*) AS count FROM tourinfo_master
      WHERE driver_id = ? AND tour_date = ?`,
      [tour.driverId, tour.tourDate]
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
      driverName as string
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

    const [result] = await connection.query(insertSql, insertValues);
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
  driverName: string
) {
  let tour_name = "";

  if (!tour.dTour_name) {
    const orderPlaceholders = tour.orderIds.map(() => "?").join(",");
    const [zipRows]: any = await conn.query(
      `SELECT zipcode FROM logistic_order WHERE order_id IN (${orderPlaceholders})`,
      tour.orderIds
    );
    if (!zipRows.length) throw new Error(`No valid orders found`);

    const zipcodes: string[] = zipRows.map((r: any) => String(r.zipcode));

    const zipcodePrefixes = Array.from(
      new Set(zipcodes.map((z) => z.substring(0, 2) || "00"))
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
    tourDateFormatted.getMonth() + 1
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
      "[tourModel] Tours,route and tour_driver segments deleted successfully"
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

// Service function
export const updateTour = async (tourData: any) => {
  const { id, tourName, comments, startTime, driverid, routeColor, tourDate } =
    tourData;

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

    // 1. Check for existing pending/in-progress tours
    const [pendingRows]: any = await connection.query(checkPendingSql, [
      driverid,
      id,
    ]);
    if (pendingRows[0].count > 0) {
      throw new Error(
        `Driver already has another pending or in-progress tour.`
      );
    }

    // 2. Check for another tour on the same date
    const [dateRows]: any = await connection.query(checkDateSql, [
      driverid,
      tourDate,
      id,
    ]);
    if (dateRows[0].count > 0) {
      throw new Error(`Driver already has another tour on ${tourDate}.`);
    }

    // 3. Check driver status
    const [userRows]: any = await connection.query(getUserIdSql, [driverid]);
    if (!userRows.length)
      throw new Error(`Driver not found with ID ${driverid}`);

    const userId = userRows[0].user_id;
    const [statusRows]: any = await connection.query(checkUserStatusSql, [
      userId,
    ]);
    if (!statusRows.length || statusRows[0].is_active === 0) {
      throw new Error(`Driver is inactive.`);
    }

    // 4. Update tourinfo_master
    const updateTourinfoQuery = `
      UPDATE tourinfo_master 
      SET tour_name = ?, comments = ?, start_time = ?, driver_id = ?, route_color = ?, tour_date = ?
      WHERE id = ?
    `;
    const [tourinfoResult] = await connection.query(updateTourinfoQuery, [
      tourName,
      comments,
      startTime,
      driverid,
      routeColor,
      tourDate,
      id,
    ]);

    // 5. Update tour_driver
    const updateDriverQuery = `
      UPDATE tour_driver 
      SET driver_id = ?, tour_date = ?
      WHERE tour_id = ?
    `;
    await connection.query(updateDriverQuery, [driverid, tourDate, id]);

    await connection.commit();
    return tourinfoResult;
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
  orderIdsToRemove: number[]
) => {
  const [rows]: any = await conn.query(
    `SELECT order_ids FROM tourinfo_master WHERE id = ?`,
    [tourId]
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
    (id) => !orderIdsToRemove.includes(id)
  );

  await conn.query(`UPDATE tourinfo_master SET order_ids = ? WHERE id = ?`, [
    JSON.stringify(updatedOrderIds),
    tourId,
  ]);

  console.log(
    `Removed ${orderIdsToRemove.length} order(s) from Tour ${tourId}. Remaing order: `,
    updatedOrderIds
  );
};
