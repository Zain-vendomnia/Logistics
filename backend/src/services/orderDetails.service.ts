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

interface FetchOrderItemsResult {
  found: boolean;
  delivered?: boolean;
  canceled?: boolean;
  status?: string;
  orderItems?: OrderItemRow[];
}

/**
 * Fetch order items for a given order number.
 * Only returns items if order is delivered.
 */
export const fetchOrderItems = async (
  orderNumber: number
): Promise<FetchOrderItemsResult> => {
  try {
    // 🧩 Step 1: Check if order exists
    const orderQuery =
      "SELECT status FROM logistic_order WHERE order_number = ? LIMIT 1";
    const [orderRows] = await pool.query<RowDataPacket[]>(orderQuery, [orderNumber]);

    if (orderRows.length === 0) {
      return { found: false };
    }

    const orderStatus = (orderRows[0].status as string).toLowerCase();

    // 🧩 Step 2: Check if the order is cancelled
    if (orderStatus === "cancelled" || orderStatus === "canceled") {
      return { found: true, canceled: true, status: orderStatus };
    }

    // 🧩 Step 3: Allow only delivered orders
    if (orderStatus !== "delivered") {
      return { found: true, delivered: false, status: orderStatus };
    }

    // 🧩 Step 4: Fetch order items
    const itemsQuery =
      "SELECT * FROM logistic_order_items WHERE order_number = ?";
    const [itemRows] = await pool.query<OrderItemRow[]>(itemsQuery, [orderNumber]);

    return {
      found: true,
      delivered: true,
      status: orderStatus,
      orderItems: itemRows || [],
    };
  } catch (error) {
    console.error("❌ Database error in fetchOrderItems:", error);
    throw new Error("Database query failed while fetching order items.");
  }
};
