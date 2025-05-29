import pool from "../database";
import { RowDataPacket } from "mysql2";

export const insertFormData = async (data: {
  orderNumber: string;
  parkingLocation: string;
  image?: Buffer | null; // Already decoded from base64 in the controller
}) => {


  try {

    // Step 1: Get order_id
    const [rows] = await pool.query<RowDataPacket[] & { order_id: number }[]>(
      "SELECT order_id FROM logistic_order WHERE order_number = ?",
      [data.orderNumber]
    );

    if (!rows || rows.length === 0) {
      throw new Error(`Order not found for orderNumber ${data.orderNumber}`);
    }

    const orderId = rows[0].order_id;

    // Step 2: Update route_segments
    const updateQuery = `
      UPDATE route_segments 
      SET parking_place = ?, customer_signature = ?
      WHERE order_id = ?
    `;

    const [result] = await pool.query(updateQuery, [
      data.parkingLocation,
      data.image ?? null,
      orderId,
    ]);

    return result;
  } catch (err) {
    console.error("❌ DB Insert Error in UpdateRouteSegment:", err);
    throw err;
  }
};
