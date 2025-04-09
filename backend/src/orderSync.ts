import axios from "axios";
import connect from "./database";
import { RowDataPacket } from "mysql2";
import { ONE_TIME_ORDERINFO_URL } from "./services/apiUrl";

export async function syncOrderData() {
  const conn = await connect();
  try {
    console.log("Fetching order data from API...");

    const response = await axios.get(ONE_TIME_ORDERINFO_URL);
    // console.log("Full API Response:", JSON.stringify(response.data, null, 2));

    const orders = response.data.data || [];

    if (!Array.isArray(orders)) {
      console.error("Error: Extracted orders is not an array, got:", typeof orders);
      return;
    }

    console.log(`Received ${orders.length} orders. Checking existing orders...`);

    // Fetch existing order numbers
    const [existingOrders] = await conn.query<RowDataPacket[]>(`SELECT order_number FROM logistic_order`);
    const existingOrderNumbers = new Set(existingOrders.map(order => order.order_number));

    const formattedOrderNumbers = existingOrders.map(order => `orderNumber: ${order.order_number}`).join(", ");
    console.log(`Existing order numbers: [${formattedOrderNumbers}]`);

    console.log(`Found ${existingOrderNumbers.size} existing orders in the database.`);

    const newOrders = orders.filter(order => !existingOrderNumbers.has(order.ordernumber));
    console.log(`New orders to insert: ${newOrders.length}`);

    if (newOrders.length === 0) {
      console.log("No new orders to insert.");
      return;
    }

    for (const order of newOrders) {
      // Convert order_time to Date and add 14 days
      const orderDate = new Date(order.ordertime);
      orderDate.setDate(orderDate.getDate() + 14);
      
      // Format as MySQL datetime string (YYYY-MM-DD HH:MM:SS)
      const expectedDeliveryTime = orderDate.toISOString().slice(0, 19).replace("T", " ");

      await conn.query(
        `INSERT INTO logistic_order 
        (order_number, customer_id, invoice_amount, payment_id, order_time, expected_delivery_time, warehouse_id, quantity, 
         article_order_number, customer_number, firstname, lastname, email, street, zipcode, city, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.ordernumber, order.user_id, order.invoice_amount, order.paymentID,
          order.ordertime, expectedDeliveryTime, order.warehouse_id, order.fkt_total_quantity,
          order.fkt_articleordernumber, order.customernumber, order.user_firstname, order.user_lastname,
          order.user_email, order.shipping_street, order.shipping_zipcode, order.shipping_city,
          order.shipping_phone
        ]
      );
    }

    console.log("New orders inserted successfully");
  } catch (error) {
    console.error("Error in syncing order data:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end();
  }
}
