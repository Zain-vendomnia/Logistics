import axios from "axios";
import dotenv from "dotenv";
import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { LogisticOrder } from "../model/LogisticOrders";
import { enqueueOrder } from "../config/eventBus";
import {
  mapShopwareOrderToLogisticOrder,
  ShopwareOrder,
  ShopwareOrderDetails,
} from "../types/order.types";

dotenv.config();

const API_URL = process.env.SHOPWARE_API_URL!;
const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.SHOPWARE_API_USERNAME}:${process.env.SHOPWARE_API_PASSWORD}`
).toString("base64");

interface MaxOrderRow extends RowDataPacket {
  maxOrderId: number | null;
}

export async function shopwareOrderSync() {
  try {
    console.log("🚚 Starting Shopware order sync...");

    // Step 1: Determine sync parameters
    const [rows] = await pool.execute<MaxOrderRow[]>(
      "SELECT MAX(shopware_order_id) AS maxOrderId FROM logistic_order"
    );

    let params: any = {};

    if (!rows.length || rows[0].maxOrderId === null) {
      params = { from_date: "2025-11-05" }; // adjust as needed
      console.log("Date condition is running...")
    } else {
      params = { last_order_id: rows[0].maxOrderId };
      console.log(
        "last order number condition is running... ",
        rows[0].maxOrderId
      );
    }

    // Step 2: Call Shopware API
    const response = await axios.get(API_URL, {
      params,
      headers: {
        Authorization: `Basic ${AUTH_CREDENTIALS}`,
      },
    });

    const ordersData = response.data?.data;

    console.log("Shopware Orders response: ", ordersData);

    if (!Array.isArray(ordersData)) {
      console.error("❌ Invalid data format from API");
      return;
    }

    console.log(`📦 Received ${ordersData.length} order records.`);

    // Step 3: Group orders
    const ordersMap = new Map<string, ShopwareOrder>();
    for (const item of ordersData) {
      if (!ordersMap.has(item.orderID)) {
        ordersMap.set(item.orderID, {
          orderID: item.orderID,
          ordernumber: item.ordernumber,
          invoice_amount: item.invoice_amount,
          paymentID: item.paymentID,
          trackingCode: item.trackingCode,
          orderStatusID: item.orderStatusID,
          ordertime: item.ordertime,
          article_sku: item.article_sku,
          user_id: item.user_id,
          customernumber: item.customernumber,
          user_email: item.user_email,
          user_firstname: item.user_firstname,
          user_lastname: item.user_lastname,
          shipping_salutation: item.shipping_salutation,
          shipping_firstname: item.shipping_firstname,
          shipping_lastname: item.shipping_lastname,
          shipping_street: item.shipping_street,
          shipping_zipcode: item.shipping_zipcode,
          shipping_city: item.shipping_city,
          shipping_phone: item.shipping_phone,
          OrderDetails: [],
        });
      }

      if (item.OrderDetails && Array.isArray(item.OrderDetails)) {
        item.OrderDetails.forEach((detail: ShopwareOrderDetails) => {
          const order = ordersMap.get(item.orderID);
          if (order) {
            order.OrderDetails.push({
              slmdl_article_id: detail.slmdl_article_id,
              slmdl_articleordernumber: detail.slmdl_articleordernumber,
              slmdl_quantity: detail.slmdl_quantity,
              warehouse_id: detail.warehouse_id,
            });
          }
        });
      }
    }

    console.warn(
      `Fetched Orders [][] ${Array.from(ordersMap.entries())
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ")}`
    );

    const orders = Array.from(ordersMap.values());
    console.log(`🗃️ Found ${orders.length} unique orders.`);

    // Step 4: Filter out existing orders
    const [existingOrders] = await pool.query<RowDataPacket[]>(
      "SELECT order_number FROM logistic_order"
    );
    const existingOrderNumbers = new Set(
      existingOrders.map((o) => o.order_number)
    );
    const newOrders = orders.filter(
      (order) => !existingOrderNumbers.has(order.ordernumber)
    );

    if (newOrders.length === 0) {
      console.log("✔️ No new orders to insert.");
      return;
    }

    console.log(`🆕 Inserting ${newOrders.length} new orders...`);
    await pool.query("START TRANSACTION");

    try {
      for (const order of newOrders) {
        if (!order.OrderDetails || order.OrderDetails.length === 0) {
          console.warn(
            `⚠️ Skipping order ${order.ordernumber} due to missing OrderDetails.`
          );
          continue;
        }

        const orderReq = mapShopwareOrderToLogisticOrder(order);
        const orderId = await LogisticOrder.createOrderAsync(orderReq);

        console.log(
          `✅ Inserted order Id: ${orderId} - 
          ${order.ordernumber} with ${order.OrderDetails.length} items.`
        );

        enqueueOrder(orderId);
      }

      await pool.query("COMMIT");
      console.log(`🎉 Successfully inserted ${newOrders.length} new orders.`);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(
        "❌ Rolled back transaction due to error:",
        err instanceof Error ? err.message : String(err)
      );
      throw err;
    }
  } catch (error: any) {
    console.error(
      "❌ Error during Shopware order sync:",
      error?.response?.data || error.message
    );
    throw error;
  }
}
