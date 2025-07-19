import { Request, Response } from "express";
import { fetchOrders } from "../../services/scheduleOrderInfo.service";
import pool from "../../database";  // Import database connection
import { RowDataPacket } from "mysql2";

export const scheduleOrderInfoController = async (_: Request, res: Response) => {
  try {
  
    // Fetch the latest lastOrderNumber from logistic_order table
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT order_number FROM logistic_order ORDER BY order_id DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(200).json({ 
        message: "last order numbder not found", 
        data: [] 
      });
    }

    // Extract lastOrderNumber from the query result
    const lastOrderNumber = rows[0].order_number;

    console.log(lastOrderNumber)
    // Call fetchOrders with the retrieved lastOrderNumber and "scheduled" type
    const orders = await fetchOrders(lastOrderNumber, "scheduled");

    return res.json(orders);
  } catch (error) {
    console.error("Error fetching scheduled orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
