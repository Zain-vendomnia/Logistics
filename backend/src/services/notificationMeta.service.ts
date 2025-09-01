import pool from "../database";
import { RowDataPacket } from "mysql2";

// Function to fetch meta data for an order
export const getNotificationData = async (orderNumber: number) => {

  try {
    // Query to get meta_key and meta_value for the given order_number
    const [rows] = await pool.execute<RowDataPacket[] & { meta_key: string, meta_value: string }[]>(
      `SELECT meta_key, meta_value 
       FROM notifications_track 
       WHERE order_number = ?`,
      [orderNumber]
    );


    if (!rows || rows.length === 0) {
      return false;
    }

    // Return the meta data
    return rows;
  } catch (err) {
    console.error("❌ DB Error in getNotificationData:", err);
    throw err;
  }
};
