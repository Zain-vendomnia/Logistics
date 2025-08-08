import axios from "axios";
import dotenv from "dotenv";
import { RowDataPacket } from "mysql2";
import pool from "./database"; // adjust if needed

dotenv.config();

const API_URL = process.env.WMS_API_URL!;
const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.WMS_API_USERNAME}:${process.env.WMS_API_PASSWORD}`
).toString("base64");

/**
 * Format JS Date to 'YYYY-MM-DD HH:mm:ss'
 */
function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

/**
 * Sync WMS orders and articles from WMS API.
 * @param from - Start date string (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
 */
export async function wmsOrderSync(from: string) {
  try {
    // If only date is passed, make sure it's "YYYY-MM-DD 00:00:00"
    let fromDateTime: string;
    if (/^\d{4}-\d{2}-\d{2}$/.test(from.trim())) {
      fromDateTime = `${from.trim()} 00:00:00`;
    } else {
      fromDateTime = from.trim();
    }

    // 'to' is always today at 23:59:59
    const now = new Date();
    const toDateTime =
      formatDateTime(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        )
      );

    // Construct query params
    const params = { from: fromDateTime, to: toDateTime };

    // For debug: Show the actual URL with parameters
    const requestUrl = `${API_URL}?from=${encodeURIComponent(
      fromDateTime
    )}&to=${encodeURIComponent(toDateTime)}`;
    console.log("🔗 WMS API Request URL:", requestUrl);

    const response = await axios.get(API_URL, {
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

    const newOrders = orders.filter(
      (order: any) => !existingNumbers.has(order.order_number)
    );
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
  } catch (error: any) {
    console.error(
      "❌ Error during WMS order fetch/insert:",
      error?.response?.data || error.message || error
    );
    throw new Error("Failed to fetch/insert WMS order data.");
  }
}
