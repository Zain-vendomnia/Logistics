import pool from "../config/database";
import { ResultSetHeader } from "mysql2/promise";

/**
 * Interface for return item
 */
interface ReturnItem {
  id: number;
  order_id?: number | null;
  order_number: string;
  slmdl_articleordernumber: string;
  quantity: number;
  returnQuantity: number;
  damageQuantity: number;
  warehouse_id?: string | null;
}

/**
 * Interface for service response
 */
interface InsertReturnResult {
  success: boolean;
  message: string;
  insertedIds?: number[];
}

/**
 * Insert return details into the returns table
 * @param orderNumber - The order number
 * @param items - Array of return items
 * @returns Result with success status and inserted IDs
 */
export const insertReturnDetails = async (
  orderNumber: string,
  items: ReturnItem[]
): Promise<InsertReturnResult> => {
  try {
    // SQL query to insert a single return item
    const sql = `
      INSERT INTO returns (
        order_id,
        order_number,
        slmdl_articleordernumber,
        quantity,
        return_quantity,
        damage_quantity,
        warehouse_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertedIds: number[] = [];

    // Insert each item
    for (const item of items) {
      const values = [
        item.order_id || null,
        orderNumber,
        item.slmdl_articleordernumber,
        item.quantity,
        item.returnQuantity,
        item.damageQuantity,
        item.warehouse_id || null,
      ];

      const [result] = await pool.query<ResultSetHeader>(sql, values);

      // Store the inserted ID
      if (result.insertId) {
        insertedIds.push(result.insertId);
      }
    }

    console.log(
      `✅ Successfully inserted ${insertedIds.length} return item(s) for order ${orderNumber}`
    );

    return {
      success: true,
      message: `Successfully inserted ${insertedIds.length} return item(s)`,
      insertedIds,
    };
  } catch (error: any) {
    console.error("❌ Error inserting return details:", error);

    return {
      success: false,
      message: error.message || "Database query failed while inserting return details.",
    };
  }
};

/**
 * Fetch all returns for a given order number (optional - for future use)
 * @param orderNumber - The order number
 * @returns Array of return items
 */
export const fetchReturnsByOrderNumber = async (
  orderNumber: string
): Promise<any[]> => {
  try {
    const sql = "SELECT * FROM returns WHERE order_number = ? ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, [orderNumber]);

    return rows as any[];
  } catch (error: any) {
    console.error("❌ Error fetching returns:", error);
    throw new Error("Database query failed while fetching returns.");
  }
};