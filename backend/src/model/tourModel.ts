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

interface TourExportData {
  id: number;
  tour_name: string;
  driver_name: string;
  tour_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface LogisticOrder {
  order_id: string;
  order_number?: string;
  net_number?: string;
  firstname?: string;
  lastname?: string;
  tourinfo_id?: number;
  tour_name?: string;
  tour_date?: string;
  start_time?: string;
  end_time?: string;
  tourinfo_created_at?: string;
  driver_name?: string;
  driver_id?: number;
  // Add other fields from your logistic_order table as needed
}

interface CombinedTourData {
  tourinfo_id: number;
  tour_name: string;
  driver_id: number;
  driver_name: string;
  tour_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  order_info: Partial<LogisticOrder>[];
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

// Function to export tour data
export const exportTours = async (tourIds: number[]): Promise<TourExportData[]> => {
  const sql = `
    SELECT 
      t.id,
      t.tour_name,
      d.name as driver_name,
      DATE_FORMAT(t.tour_date, '%Y-%m-%d') as tour_date,
      t.start_time,
      t.end_time,
      DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM 
      tourinfo_master t
    LEFT JOIN 
      driver_details d ON t.driver_id = d.id
    WHERE 
      t.id IN (?)
  `;

  try {
    console.log('[tourModel] Exporting tours with IDs:', tourIds);
    const [rows] = await pool.query(sql, [tourIds]);
    console.log('[tourModel] Fetched tour data:', rows);
    return rows as TourExportData[];
  } catch (err) {
    console.error('[tourModel] Error exporting tours:', err);
    throw err;
  }
};

// Get logistic orders for a specific tour

export const getOrdersForTour = async (tourId: number): Promise<LogisticOrder[]> => {
  const sql = `
    SELECT 
      lo.*,
      tm.id AS tourinfo_id,
      tm.tour_name,
      tm.tour_date,
      tm.start_time,
      tm.end_time,
      tm.created_at AS tourinfo_created_at,
      dd.name AS driver_name,
      dd.id AS driver_id
    FROM 
      logistic_order lo
    JOIN 
      tourinfo_master tm ON FIND_IN_SET(lo.order_id, REPLACE(REPLACE(REPLACE(tm.order_ids, '[', ''), ']', ''), ' ', ''))
    LEFT JOIN
      driver_details dd ON tm.driver_id = dd.id
    WHERE 
      tm.id = ?
  `;

  try {
    console.log('[tourModel] Fetching orders for tour ID:', tourId);
    const [rows] = await pool.query(sql, [tourId]);
    // console.log(`[tourModel] Found ${rows.length} orders for tour ${tourId}`);
    return rows as LogisticOrder[];
  } catch (err) {
    console.error('[tourModel] Error fetching orders for tour:', err);
    throw err;
  }
};

// Updated exportToursWithOrders to include driver information
export const exportToursWithOrders = async (tourIds: number[]): Promise<CombinedTourData[]> => {
  try {
    console.log('[tourModel] Starting export process for tour IDs:', tourIds);
    
    // Get the basic tour information
    const tourData = await exportTours(tourIds);
    console.log('[tourModel] Basic tour data retrieved:', tourData);
    
    // Get all orders for all requested tours
    const ordersByTour = await Promise.all(
      tourData.map(async (tour) => {
        const orders = await getOrdersForTour(tour.id);
        return { tourId: tour.id, orders };
      })
    );
    console.log('[tourModel] Orders by tour retrieved:', ordersByTour);

    // Combine the data into the desired structure
    const combinedData = tourData.map(tour => {
      const tourOrders = ordersByTour.find(item => item.tourId === tour.id)?.orders || [];
      const firstOrder = tourOrders[0] || {};
      
      return {
        tourinfo_id: tour.id,
        tour_name: tour.tour_name,
        driver_id: firstOrder.driver_id || 0,
        driver_name: firstOrder.driver_name || tour.driver_name || 'Unknown Driver',
        tour_date: tour.tour_date,
        start_time: tour.start_time,
        end_time: tour.end_time,
        created_at: tour.created_at,
        order_info: tourOrders.map(order => ({
          order_id: order.order_id,
          order_number: order.order_number,
          net_number: order.net_number,
          firstname: order.firstname,
          lastname: order.lastname,
          // Include any other order fields you need
        }))
      };
    });

    console.log('[tourModel] Combined data prepared:', combinedData);
    return combinedData;
  } catch (err) {
    console.error('[tourModel] Error in exportToursWithOrders:', err);
    throw err;
  }
};