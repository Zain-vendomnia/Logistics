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

// Function to insert a tour into the database
export const createTour = async (tour: Tour) => {
  const sql = `
    INSERT INTO tourinfo_master (
      tour_name, comments, start_time, end_time, driver_id, route_color, tour_date, order_ids, warehouse_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    tour.tourName,
    tour.comments,
    tour.startTime,
    tour.endTime,
    tour.driverid,
    tour.routeColor,
    tour.tourDate,
    JSON.stringify(tour.orderIds),
    tour.warehouseId,
  ];

  try {
    console.log('[tourModel] Creating tour with values:', values);
    const [result] = await pool.query(sql, values);
    console.log('[tourModel] Tour created successfully');
    return result;
  } catch (err) {
    console.error('[tourModel] Error creating tour:', err);
    throw err;
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

// Function to delete multiple tours
export const deleteTours = async (tourIds: number[]) => {
  const sql = `
    DELETE FROM tourinfo_master 
    WHERE id IN (?)
  `;

  try {
    console.log('[tourModel] Deleting tours with IDs:', tourIds);
    const [result] = await pool.query(sql, [tourIds]);
    console.log('[tourModel] Tours deleted successfully');
    return result;
  } catch (err) {
    console.error('[tourModel] Error deleting tours:', err);
    throw err;
  }
};

// Function to update a tour and its corresponding tour_driver data
export const updateTour = async (tourData: any) => {
  const { id, tourName, comments, startTime, endTime, driverid, routeColor, tourDate } = tourData;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update tourinfo_master
    const updateTourinfoQuery = `
      UPDATE tourinfo_master 
      SET tour_name = ?, comments = ?, start_time = ?, end_time = ?, driver_id = ?, route_color = ?, tour_date = ?
      WHERE id = ?
    `;
    const [tourinfoResult] = await connection.query(updateTourinfoQuery, [
      tourName,
      comments,
      startTime,
      endTime,
      driverid,
      routeColor,
      tourDate,
      id,
    ]);

    // Update tour_driver
    const updateDriverQuery = `
      UPDATE tour_driver 
      SET driver_id = ?, tour_date = ?
      WHERE tour_id = ?
    `;
    await connection.query(updateDriverQuery, [
      driverid,
      tourDate,
      id,
    ]);

    await connection.commit();
    return tourinfoResult;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
