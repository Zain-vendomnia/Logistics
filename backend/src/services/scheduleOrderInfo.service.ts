import axios from "axios";
import dotenv from "dotenv";
import  connect  from "../database"; // Use the global connection variable
import { RowDataPacket } from "mysql2/promise"; // Ensure it's from `mysql2/promise`

dotenv.config();

const API_URL = process.env.API_URL!;
const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.API_USERNAME}:${process.env.API_PASSWORD}`
).toString("base64");
export const fetchOrders = async (lastOrderNumber: string, type: string) => {
  console.log(`Fetching orders from API with lastOrderNumber: ${lastOrderNumber} and type: ${type}`);

  try {
    const conn = await connect();
    const params = { lastOrderNumber, type };

    // Fetch orders from API
    const response = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Basic ${AUTH_CREDENTIALS}` },
    });

    const orders = response.data.data || [];

    if (!Array.isArray(orders) || orders.length === 0) {
      console.warn("No new orders found from the Shopware API.");
      return { message: "No new orders available at this time." };  // Return meaningful feedback
    }

    console.log(`Received ${orders.length} orders. Checking for duplicates...`);

    // Fetch existing order numbers in a single query
    const [existingOrders] = await conn.query<RowDataPacket[]>(`SELECT order_number FROM logistic_order`);
    const existingOrderNumbers = new Set(existingOrders.map(order => order.order_number));

    console.log(`Found ${existingOrderNumbers.size} existing orders in the database.`);

    // Filter only new orders
    const newOrders = orders.filter(order => !existingOrderNumbers.has(order.ordernumber));
    
    console.log(`New orders to insert: ${newOrders.length}`);
    console.log("newOrders", newOrders);

    if (newOrders.length === 0) {
      console.info("All fetched orders already exist in the database. No new orders to insert.");
      return { message: "No new orders to insert." };
    }

    // Prepare bulk insert data
    const insertData = newOrders.map(order => {
      const orderDate = new Date(order.ordertime);
      orderDate.setDate(orderDate.getDate() + 14);
      const expectedDeliveryTime = orderDate.toISOString().slice(0, 19).replace("T", " ");

      return [
        order.ordernumber, order.user_id, order.invoice_amount, order.paymentID,
        order.ordertime, expectedDeliveryTime, order.warehouse_id, order.fkt_total_quantity,
        order.fkt_articleordernumber, order.customernumber, order.user_firstname, order.user_lastname,
        order.user_email, order.shipping_street, order.shipping_zipcode, order.shipping_city,
        order.shipping_phone
      ];
    });

    // Execute bulk insert
    const query = `
      INSERT INTO logistic_order 
      (order_number, customer_id, invoice_amount, payment_id, order_time, expected_delivery_time, warehouse_id, quantity, 
       article_order_number, customer_number, firstname, lastname, email, street, zipcode, city, phone) 
      VALUES ?
    `;

    await conn.query(query, [insertData]);
    console.log("✅ New orders inserted successfully!");
    return { message: "New orders inserted successfully.", insertedOrders: newOrders.length };
  } catch (error) {
    console.error("❌ Error fetching orders from API:", error);
    throw new Error("Failed to fetch order data");
  }
};
