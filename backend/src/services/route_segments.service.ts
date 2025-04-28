import pool from "../database";

export const insertRouteSegment = async (data: {
  tour_id: string;
  order_id: string;
  start_latitude?: string;
  start_longitude?: string;
  end_latitude?: string;
  end_longitude?: string;
  status?: string;
  image?: Buffer | null; // Already decoded from base64 in the controller
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
      data.image ?? null, // Insert the image buffer directly
    ]);

    return result;
  } catch (err) {
    console.error("❌ DB Insert Error in insertRouteSegment:", err);
    throw err;
  }
};

export const getRouteSegmentImage = async (id: string): Promise<Buffer | null> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT delivered_item_pic FROM route_segments WHERE id = ?",
      [id]
    );

    if (rows.length === 0 || !rows[0].delivered_item_pic) {
      return null;
    }

    return rows[0].delivered_item_pic; // This is a Buffer
  } catch (err) {
    console.error("❌ DB Error fetching image:", err);
    throw err;
  }
};
