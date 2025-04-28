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
}

// Function to insert a tour into the database
export const createTour = async (tour: Tour) => {
  const sql = `
    INSERT INTO tourinfo_master (tour_name, comments, start_time, end_time, driver_id, route_color, tour_date, order_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
  ];

  try {
    console.log('[tourModel] Creating tour with values:', values);
    const [result] = await pool.query(sql, values);
    console.log('[tourModel] Tour created successfully, result:', result);
    return result;
  } catch (err) {
    console.error('[tourModel] Error creating tour:', err);
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
    console.log('[tourModel] Tours deleted successfully, result:', result);
    return result;
  } catch (err) {
    console.error('[tourModel] Error deleting tours:', err);
    throw err;
  }
};

export const updateTour = async (tourData: any) => {
  const { id, tourName, comments, startTime, endTime, driverid, routeColor, tourDate } = tourData;
  
  const query = `
    UPDATE tourinfo_master 
    SET tour_name = ?, comments = ?, start_time = ?, end_time = ?, driver_id = ?, route_color = ?, tour_date = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    tourName,
    comments,
    startTime,
    endTime,
    driverid,
    routeColor,
    tourDate,
    id,
  ]);

  return result;
};
