import pool from "../database";

// Insert route segment data into DB
export const insertRouteSegment = async (data: {
  tour_id: string;
  order_id: string;
  start_latitude?: string;
  start_longitude?: string;
  end_latitude?: string;
  end_longitude?: string;
  status?: string;
  image?: string; // Image filename
}) => {
  try {
    const query = `
      INSERT INTO route_segments 
      (tour_id, order_id, start_latitude, start_longitude, end_latitude, end_longitude, status, delivered_item_pic) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

   
    const [result] = await pool.query(query, [
      data.tour_id,
      data.order_id,
      data.start_latitude ?? null,
      data.start_longitude ?? null,
      data.end_latitude ?? null,
      data.end_longitude ?? null,
      data.status ?? null,
      data.image ?? null,
    ]);

    return result;
  } catch (err) {
    console.error("❌ DB Insert Error in insertRouteSegment:", err);
    throw err; // Let the controller handle the HTTP response
  }
};
