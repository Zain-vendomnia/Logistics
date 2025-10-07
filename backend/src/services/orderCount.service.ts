import pool from "../config/database";
import { RowDataPacket } from "mysql2/promise";

interface CountRow extends RowDataPacket {
  ordersCount: number;
}

/**
 * Fetches the total number of orders in the logistic_order table.
 * @returns An object with a single property `ordersCount`.
 */
export const fetchOrdersCount = async (): Promise<{ ordersCount: number }> => {
  const sql =
    "SELECT COUNT(*) AS ordersCount, MAX(updated_at) as last_updated FROM logistic_order";
  const [rows] = await pool.query<CountRow[]>(sql);

  if (rows.length === 0) {
    // This should basically never happen, but we guard against it.
    throw new Error("No rows returned when counting orders");
  }

  return { ordersCount: rows[0].ordersCount };
};
