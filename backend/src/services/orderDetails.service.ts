import pool from "../config/database";
import { RowDataPacket } from "mysql2/promise";

interface OrderItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  order_number: string;
  slmdl_article_id: number;
  slmdl_articleordernumber: string;
  quantity: number;
  warehouse_id: number | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Fetch all order items for a given order number.
 */
export const fetchOrderItems = async (
  orderNumber: number
): Promise<{ orderItems: OrderItemRow[] }> => {

  try {
    const sql = "SELECT * FROM logistic_order_items WHERE order_number = ?";

    const [rows] = await pool.query<OrderItemRow[]>(sql, [orderNumber]);

    if (rows.length === 0) {
    }

    return { orderItems: rows || [] };
  } catch (error: any) {
    throw new Error("Database query failed while fetching order items.");
  }
};
