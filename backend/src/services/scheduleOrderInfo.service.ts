import axios from "axios";
import dotenv from "dotenv";
import pool from "../database";
import { RowDataPacket } from "mysql2/promise";
import { GeocodingService } from "./geocodingService";

dotenv.config();

const API_URL = process.env.API_URL!;
const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.API_USERNAME}:${process.env.API_PASSWORD}`
).toString("base64");

export const fetchOrders = async (lastOrderNumber: string, type: string) => {
  console.log(`Fetching orders from API with lastOrderNumber: ${lastOrderNumber} and type: ${type}`);
 
  try {
    const params = { lastOrderNumber, type };
    const response = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Basic ${AUTH_CREDENTIALS}` },
    });

    const orders = response.data.data || [];

    if (!Array.isArray(orders) || orders.length === 0) {
      console.warn("No new orders found from the Shopware API.");
      return { message: "No new orders available at this time." };
    }

    console.log(`Received ${orders.length} orders. Checking for duplicates...`);

    // Fetch existing order numbers in a single query
    const [existingOrders] = await pool.query<RowDataPacket[]>(
      "SELECT order_number FROM logistic_order"
    );
    const existingOrderNumbers = new Set(existingOrders.map(order => order.order_number));

    console.log(`Found ${existingOrderNumbers.size} existing orders in the database.`);

    // Filter only new orders
    const newOrders = orders.filter(order => !existingOrderNumbers.has(order.ordernumber));
    
    if (newOrders.length === 0) {
      console.info("All fetched orders already exist in the database. No new orders to insert.");
      return { message: "No new orders to insert." };
    }

    console.log(`Processing ${newOrders.length} new orders...`);

    await pool.query("START TRANSACTION");

    try {
      for (const order of newOrders) {
        // Calculate expected delivery time
        const orderDate = new Date(order.ordertime);
        orderDate.setDate(orderDate.getDate() + 14);
        const expectedDeliveryTime = orderDate.toISOString().slice(0, 19).replace("T", " ");

        const warehouse_id = order.OrderDetails[0].warehouse_id ?? 0;
        // Insert main order
        const [result] = await pool.query(
          `INSERT INTO logistic_order 
          (order_number, customer_id, invoice_amount, payment_id, warehouse_id, order_time, 
           expected_delivery_time,   
           customer_number, firstname, lastname, email, street, zipcode, city, phone) 
          VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.ordernumber,
            order.user_id,
            order.invoice_amount,
            order.paymentID,
            warehouse_id,
            order.ordertime,
            expectedDeliveryTime,
            order.customernumber,
            order.user_firstname,
            order.user_lastname,
            order.user_email,
            order.shipping_street,
            order.shipping_zipcode,
            order.shipping_city,
            order.shipping_phone
          ]
        );

        const orderId = (result as any).insertId;

        // Insert order items if they exist
        if (order.OrderDetails && Array.isArray(order.OrderDetails)) {
          for (const item of order.OrderDetails) {
            await pool.query(
              `INSERT INTO logistic_order_items 
              (order_id, order_number, slmdl_article_id, 
               slmdl_articleordernumber, quantity, warehouse_id) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                orderId,
                order.ordernumber,
                item.slmdl_article_id,
                item.slmdl_articleordernumber,
                item.slmdl_quantity,
                item.warehouse_id
              ]
            );
          }
        }

        console.log(`Inserted order ${order.ordernumber} with ${order.OrderDetails?.length || 0} items`);
      }

      await pool.query("COMMIT");
      console.log("✅ Transaction committed successfully");

      // Process orders with missing coordinates
      const [ordersWithMissingCoords] = await pool.query<RowDataPacket[]>(
        'SELECT order_id, street, city, zipcode FROM logistic_order WHERE lattitude IS NULL OR longitude IS NULL'
      );

      for (const order of ordersWithMissingCoords) {
        await checkAndUpdateLatLng(order.order_id, order.street, order.city, order.zipcode);
      }

      return { 
        message: "New orders inserted successfully.", 
        insertedOrders: newOrders.length 
      };
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("❌ Transaction rolled back due to error:", error);
      throw new Error("Failed to insert order data");
    }
  } catch (error) {
    console.error("Error in fetchOrders:", error);
    throw error;
  }
};

const checkAndUpdateLatLng = async (order_id: number, street: string, city: string, zipcode: string) => {
  try {
    const serviceData = await GeocodingService.geocodeOrderUpdatedCustomer(
      order_id, 
      street, 
      city, 
      zipcode
    );
    
    if (serviceData) {
      console.log(`Successfully updated lat/lng for order ID ${order_id}`);
    } else {
      console.warn(`Failed to update lat/lng for order ID ${order_id}`);
    }
  } catch (error) {
    console.error(`Error while updating lat/lng for order ID ${order_id}:`, error);
  }
};