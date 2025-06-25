import pool from '../database';

interface Tour {
  id?: number;
  tourName: string;
  comments: string;
  startTime: string;
  endTime: string;
  driverid: number;
  routeColor: string;
  tourDate: Date;
  orderIds: number[];
  warehouseId: number;
}

export const createTour = async (tour: Tour) => {
  // const checkPendingSql = `
  //   SELECT COUNT(*) AS count FROM tourinfo_master
  //   WHERE driver_id = ? AND tour_status IN ('pending', 'in-progress')
  // `;

  const checkDateSql = `
    SELECT COUNT(*) AS count FROM tourinfo_master
    WHERE driver_id = ? AND tour_date = ?
  `;

  const getUserIdFromDriver = `
    SELECT user_id FROM driver_details
    WHERE id = ?
  `;

  const checkUserStatusSql = `
    SELECT is_active FROM users
    WHERE user_id = ?
  `;

  const insertSql = `
    INSERT INTO tourinfo_master (
      tour_name, comments, start_time, driver_id, route_color, tour_date, order_ids, warehouse_id, expected_delivery_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // 1. Validate pending/in-progress
    // const [pendingRows]: any = await pool.query(checkPendingSql, [tour.driverid]);
    // if (pendingRows[0].count > 0) {
    //   throw new Error(`Driver already has a pending or in-progress tour. Complete it before assigning a new one.`);
    // }

    // 2. Get user_id from driver
    const [driverUserRows]: any = await pool.query(getUserIdFromDriver, [tour.driverid]);
    if (!driverUserRows.length) {
      throw new Error(`Driver not found with ID ${tour.driverid}`);
    }
    const userId = driverUserRows[0].user_id;

    // 3. Check user status from users table
    const [userStatusRows]: any = await pool.query(checkUserStatusSql, [userId]);
    if (!userStatusRows.length) {
      throw new Error(`User not found with ID ${userId}`);
    }
    if (userStatusRows[0].is_active == 0) {
      throw new Error(`Driver is inactive`);
    }

    // 4. Check duplicate tour date
    const [sameDateRows]: any = await pool.query(checkDateSql, [tour.driverid, tour.tourDate]);
    if (sameDateRows[0].count > 0) {
      throw new Error(`Driver already has a tour on ${tour.tourDate}`);
    }

    // 5. Fetch driver name
    const [driverRows]: any = await pool.query(`SELECT name FROM driver_details WHERE id = ?`, [tour.driverid]);
    const driverName = driverRows[0].name.replace(/\s+/g, '');

    // 6. Validate order IDs
    if (!Array.isArray(tour.orderIds) || tour.orderIds.length === 0) {
      throw new Error('No order IDs provided for this tour.');
    }

    // 7. Fetch zip codes from order IDs
    const orderPlaceholders = tour.orderIds.map(() => '?').join(',');
    const [zipRows]: any = await pool.query(
      `SELECT zipcode FROM logistic_order WHERE order_id IN (${orderPlaceholders})`,
      tour.orderIds
    );
    if (!zipRows.length) throw new Error(`No valid orders found`);

    const zipcodes = zipRows.map((r: any) => r.zipcode);
    const firstZip = zipcodes[0];
    const lastZip = zipcodes[zipcodes.length - 1];

    const firstZipPrefix = firstZip.substring(0, 2);
    const lastZipPrefix = lastZip.substring(0, 2);

    const tourDateFormatted = new Date(tour.tourDate);
    const dayName = tourDateFormatted.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = `${tourDateFormatted.getFullYear()}.${String(tourDateFormatted.getMonth() + 1).padStart(2, '0')}.${String(tourDateFormatted.getDate()).padStart(2, '0')}`;

    const tourName = `PLZ-${firstZipPrefix}-${lastZipPrefix}-${driverName}-${dayName}-${formattedDate}`;

    const values = [
      tourName,
      tour.comments || null,
      tour.startTime,
      tour.driverid,
      tour.routeColor,
      tour.tourDate,
      JSON.stringify(tour.orderIds),
      tour.warehouseId,
      tour.orderIds.length // 👈 this is your expected_delivery_count
    ];

    console.log('[tourModel] Creating tour with values:', values);

    const [result] = await pool.query(insertSql, values);
    return result;

  } catch (err) {
    if (err instanceof Error) {
      console.error('[tourModel] Error creating tour:', err.message);
      throw err;
    } else {
      console.error('[tourModel] Unknown error:', err);
      throw new Error('An unknown error occurred while creating the tour.');
    }
  }
};

// Function to insert a tour_driver data into the database
export const insertTourDriverData = async (tour: any) => {
  const sql = `
    INSERT INTO tour_driver (tour_id, driver_id, tour_date)
    VALUES (?, ?, ?)
  `;

  const values = [tour.tour_id, tour.driver_id, tour.tour_date];

  try {
    console.log('[tour_driver] Creating tour_driver entry:', values);
    const [result] = await pool.query(sql, values);
    console.log('[tour_driver] Entry created successfully');
    return result;
  } catch (err) {
    console.error('[tour_driver] Error inserting tour_driver data:', err);
    throw err;
  }
};

export const deleteTours = async (tourIds: number[]) => {
  const conn = await pool.getConnection();

  try {
    console.log('[tourModel] Deleting tours with IDs:', tourIds);

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

    console.log('[tourModel] Tours,route and tour_driver segments deleted successfully');
    return result;
  } catch (err) {
    await conn.rollback();
    console.error('[tourModel] Error deleting tours:', err);
    throw err;
  } finally {
    conn.release();
  }
};

// Service function
export const updateTour = async (tourData: any) => {
  const { id, tourName, comments, startTime, driverid, routeColor, tourDate } = tourData;

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
    const [pendingRows]: any = await connection.query(checkPendingSql, [driverid, id]);
    if (pendingRows[0].count > 0) {
      throw new Error(`Driver already has another pending or in-progress tour.`);
    }

    // 2. Check for another tour on the same date
    const [dateRows]: any = await connection.query(checkDateSql, [driverid, tourDate, id]);
    if (dateRows[0].count > 0) {
      throw new Error(`Driver already has another tour on ${tourDate}.`);
    }

    // 3. Check driver status
    const [userRows]: any = await connection.query(getUserIdSql, [driverid]);
    if (!userRows.length) throw new Error(`Driver not found with ID ${driverid}`);

    const userId = userRows[0].user_id;
    const [statusRows]: any = await connection.query(checkUserStatusSql, [userId]);
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
      console.error('[updateTour] Error:', error.message);
      throw error;
    } else {
      console.error('[updateTour] Unknown error:', error);
      throw new Error('An unknown error occurred while updating the tour.');
    }
  } finally {
    connection.release();
  }
};
