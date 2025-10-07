import pool from "../config/database";
import { RowDataPacket } from "mysql2";

// Function to fetch meta data for an order
export const getNotificationData = async (orderNumber: number) => {
  try {
    // Query to get meta_key and meta_value for the given order_number
    const [rows] = await pool.execute<
      RowDataPacket[] & { meta_key: string; meta_value: string }[]
    >(
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

// Function to add or update metadata for an order
export const updateNotificationData = async (
  orderNumber: number,
  meta_key: string,
  meta_value: string
) => {
  try {
    // Check if a row with orderNumber and meta_key exists
    const [rows] = await pool.execute(
      `SELECT 1 FROM notifications_track WHERE order_number = ? AND meta_key = ? LIMIT 1`,
      [orderNumber, meta_key]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      // Exists → Update
      const [result] = await pool.execute(
        `UPDATE notifications_track SET meta_value = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ? AND meta_key = ?`,
        [meta_value, orderNumber, meta_key]
      );
      return result;
    } else {
      // Not exists → Insert
      const [result] = await pool.execute(
        `INSERT INTO notifications_track (order_number, meta_key, meta_value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderNumber, meta_key, meta_value]
      );
      return result;
    }
  } catch (err) {
    console.error("❌ DB Error in updateNotificationData:", err);
    throw err;
  }
};
