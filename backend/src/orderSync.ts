import axios from "axios";
import pool from "./database";
import { RowDataPacket } from "mysql2";
import { ONE_TIME_ORDERINFO_URL } from "./services/apiUrl";
import { GeocodingService } from "./services/geocodingService";

export async function syncOrderData() {

  try {
    console.log("Fetching order data from API...");
    const response = await axios.get(ONE_TIME_ORDERINFO_URL);
    const ordersData = response.data.data || [];

    if (!Array.isArray(ordersData)) {
      console.error("Error: Expected array of orders, got:", typeof ordersData);
      return;
    }

    console.log(`Received ${ordersData.length} order records. Processing...`);

    const ordersMap = new Map<string, any>();
    for (const item of ordersData) {
      if (!ordersMap.has(item.orderID)) {
        ordersMap.set(item.orderID, {
          orderID: item.orderID,
          ordernumber: item.ordernumber,
          invoice_amount: item.invoice_amount,
          paymentID: item.paymentID,
          ordertime: item.ordertime,
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
          OrderDetails: []
        });
      }

      if (item.OrderDetails && Array.isArray(item.OrderDetails)) {
        item.OrderDetails.forEach((detail: any) => {
          ordersMap.get(item.orderID).OrderDetails.push({
            slmdl_article_id: detail.slmdl_article_id,
            slmdl_articleordernumber: detail.slmdl_articleordernumber,
            slmdl_quantity: detail.slmdl_quantity,
            warehouse_id: detail.warehouse_id
          });
        });
      }
    }

    const orders = Array.from(ordersMap.values());
    console.log(`Found ${orders.length} unique orders after grouping.`);

    const [existingOrders] = await pool.query<RowDataPacket[]>(
      "SELECT order_number FROM logistic_order"
    );
    const existingOrderNumbers = new Set(existingOrders.map(o => o.order_number));
    const newOrders = orders.filter(order => !existingOrderNumbers.has(order.ordernumber));

    if (newOrders.length === 0) {
      console.log("No new orders to insert.");
      return;
    }

    console.log(`Inserting ${newOrders.length} new orders...`);

    await pool.query("START TRANSACTION");

    try {
      for (const order of newOrders) {
        if (!order.OrderDetails || order.OrderDetails.length === 0) {
          console.warn(`Skipping order ${order.ordernumber} due to missing OrderDetails.`);
          continue;
        }

        const warehouse_id = order.OrderDetails[0].warehouse_id ?? 0;

        const orderDate = new Date(order.ordertime);
        orderDate.setDate(orderDate.getDate() + 14);
        const expectedDeliveryTime = orderDate.toISOString().slice(0, 19).replace("T", " ");

        const [result] = await pool.query(
          `INSERT INTO logistic_order (
            order_number, customer_id, invoice_amount, payment_id, warehouse_id, order_time,
            expected_delivery_time, customer_number, firstname, lastname,
            email, street, zipcode, city, phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.ordernumber,
            order.user_id,
            order.invoice_amount,
            order.paymentID,
            warehouse_id,
            order.ordertime,
            expectedDeliveryTime,
            order.customernumber,
            order.shipping_firstname || order.user_firstname,
            order.shipping_lastname || order.user_lastname,
            order.user_email,
            order.shipping_street,
            order.shipping_zipcode,
            order.shipping_city,
            order.shipping_phone
          ]
        );

        const orderId = (result as any).insertId;

        for (const item of order.OrderDetails) {
          await pool.query(
            `INSERT INTO logistic_order_items (
              order_id, order_number, slmdl_article_id,
              slmdl_articleordernumber, quantity, warehouse_id
            ) VALUES (?, ?, ?, ?, ?, ?)`,
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

        console.log(`Inserted order ${order.ordernumber} with ${order.OrderDetails.length} items`);
         // Process orders with missing coordinates
      const [ordersWithMissingCoords] = await pool.query<RowDataPacket[]>(
        'SELECT order_id, street, city, zipcode FROM logistic_order WHERE lattitude IS NULL OR longitude IS NULL'
      );

      for (const order of ordersWithMissingCoords) {
        await checkAndUpdateLatLng(order.order_id, order.street, order.city, order.zipcode);
      }
      }

      await pool.query("COMMIT");
      console.log(`✅ Successfully inserted ${newOrders.length} orders with their items.`);
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("❌ Transaction rolled back due to error:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  } catch (error) {
    console.error("🚨 Error in syncing order data:", error instanceof Error ? error.message : String(error));
  } 
  
}

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