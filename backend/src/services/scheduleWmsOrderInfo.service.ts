import axios from "axios";
import dotenv from "dotenv";
import pool from "../database";
import { RowDataPacket } from "mysql2/promise";

dotenv.config();

const WMS_API_URL = process.env.WMS_API_URL!;

const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.WMS_API_USERNAME}:${process.env.WMS_API_PASSWORD}`
).toString("base64");

export const fetchWmsOrder = async (from: string, to: string) => {
  try {
  
    const params = { from, to }; // ✅ change keys here

    const requestUrl = `${WMS_API_URL}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    console.log("🔗 WMS API Request URL:", requestUrl);

    const response = await axios.get(WMS_API_URL, {
      params,
      headers: { Authorization: `Basic ${AUTH_CREDENTIALS}` },
    });

    const orders = response.data?.data || [];

    if (!Array.isArray(orders) || orders.length === 0) {
      console.warn("⚠️ No orders received from WMS API.");
      return { message: "No new orders available." };
    }

    console.log(`📦 Total orders received: ${orders.length}`);

    // Get existing order numbers
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT order_number FROM wms_orders"
    );
    const existingNumbers = new Set(existing.map((o) => o.order_number));

    const newOrders = orders.filter((order) => !existingNumbers.has(order.order_number));
    console.log(`✅ New orders to insert: ${newOrders.length}`);

    if (newOrders.length === 0) {
      return { message: "All WMS orders already exist. No new entries." };
    }

    // Insert into `wms_orders` table
    for (const order of newOrders) {
      const [result]: any = await pool.query(
        `INSERT INTO wms_orders (order_id, order_number) VALUES (?, ?)`,
        [order.order_id, order.order_number]
      );

      const insertedOrderId = result.insertId;

      // Insert related articles
      const articles = order.articles || [];
      for (const art of articles) {
        await pool.query(
          `INSERT INTO wms_order_articles 
            (wms_order_id, article_id, article_detail_id, article_number, quantity, warehouse_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
          [
            insertedOrderId,
            art.article_id,
            art.article_detail_id,
            art.article_number,
            art.quantity,
            art.warehouse_id,
          ]
        );
      }
    }

    console.log("🟢 WMS Orders and Articles inserted successfully.");
    return {
      message: "WMS orders and articles inserted successfully.",
      insertedOrders: newOrders.length,
    };
  } catch (error) {
    console.error("❌ Error during WMS order fetch/insert:", error);
    throw new Error("Failed to fetch/insert WMS order data.");
  }
};
