// import pool from "../config/database";
// import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";
// import { CancelOrderItem, Order } from "../types/order.types";
// import logger from "../config/logger";

// export interface InsertCancelResult {
//   success: boolean;
//   message: string;
//   cancelId?: number;
//   insertedItemIds?: number[];
// }

// export interface ServiceResult {
//   success: boolean;
//   message: string;
// }

// export interface DeleteAllResult extends ServiceResult {
//   deletedCount?: number;
// }

// const ORDERS_BASE_QUERY = `
//   SELECT
//     co.order_id,
//     co.parent_order_id,
//     co.order_number,
//     co.status,
//     co.warehouse_id,
//     wd.town AS warehouse_town,
//     CONCAT(co.street, ', ', co.city, ', ', co.zipcode) AS address,
//     CONCAT(co.firstname, ' ', co.lastname) AS customer_name,
//     co.phone AS contact_number,
//     co.email,
//     co.created_at,
//     u.username AS created_by,
//     (SELECT COUNT(*) FROM logistic_order_items WHERE order_id = co.id) AS items_count,
//     FROM logistic_order co
//     `;
// // FROM cancels_order co
// // co.user_id,
// // LEFT JOIN warehouse_details wd ON co.warehouse_id = wd.warehouse_id
// // LEFT JOIN users u ON co.user_id = u.user_id
// // (SELECT COALESCE(SUM(cancel_quantity), 0) FROM logistic_order_items WHERE order_id = co.id) AS total_cancelled_qty

// const mapOrderRow = (order: RowDataPacket): Partial<Order> =>
//   ({
//     id: order.cancel_id,
//     order_number: order.order_number,
//     status: order.status,
//     warehouse_id: order.warehouse_id,
//     phone: order.contact_number,
//     email: order.email,
//     created_at: order.created_at,
//     items_count: order.items_count,
//     total_cancelled_qty: order.total_cancelled_qty,
//     user_id: order.user_id,
//     created_by: order.created_by || "Unknown",
//     customer_name: order.customer_name,
//     address: order.address,
//   } as any);

// async function withConnection<T>(
//   operation: (connection: PoolConnection) => Promise<T>
// ): Promise<T> {
//   const connection = await pool.getConnection();
//   try {
//     return await operation(connection);
//   } finally {
//     connection.release();
//   }
// }

// async function withTransaction<T>(
//   operation: (connection: PoolConnection) => Promise<T>
// ): Promise<T> {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     const result = await operation(connection);
//     await connection.commit();
//     return result;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// // GET ORDERS WITHOUT ITEMS
// export const getAllCancelOrders = async (): Promise<Partial<Order>[]> => {
//   return withConnection(async (connection) => {
//     try {
//       const [cancelOrders] = await connection.execute<RowDataPacket[]>(
//         `${ORDERS_BASE_QUERY} ORDER BY co.created_at DESC`
//       );
//       return cancelOrders.map(mapOrderRow);
//     } catch (error) {
//       logger.info("Error in getAllCancelOrders:", error);
//       throw new Error("Failed to fetch cancel orders");
//     }
//   });
// };

// export const searchCancelByOrderNumber = async (
//   orderNumber: string
// ): Promise<Partial<Order>[]> => {
//   return withConnection(async (connection) => {
//     try {
//       const searchPattern = `%${orderNumber}%`;
//       const [cancelOrders] = await connection.query<RowDataPacket[]>(
//         `${ORDERS_BASE_QUERY}
//          WHERE co.order_number LIKE ?
//          ORDER BY co.created_at DESC`,
//         [searchPattern]
//       );
//       return cancelOrders.map(mapOrderRow);
//     } catch (error) {
//       console.error("❌ Error in searchCancelByOrderNumber:", error);
//       throw new Error(`Failed to search cancel orders for: ${orderNumber}`);
//     }
//   });
// };

// // ==========================================
// // GET CANCEL ORDER ITEMS (LAZY LOADING)
// // ==========================================
// export const getCancelOrderItems = async (
//   orderNumber: string
// ): Promise<Partial<CancelOrderItem>[]> => {
//   return withConnection(async (connection) => {
//     try {
//       const [orderRows] = await connection.query<RowDataPacket[]>(
//         `SELECT id FROM cancels_order WHERE order_number = ? LIMIT 1`,
//         [orderNumber]
//       );

//       if (!orderRows?.length) return [];

//       const [items] = await connection.query<RowDataPacket[]>(
//         `SELECT id, cancel_id, article_sku, quantity, cancel_quantity, created_at, updated_at
//          FROM cancels_order_items
//          WHERE cancel_id = ?
//          ORDER BY id ASC`,
//         [orderRows[0].id]
//       );

//       return items.map((item) => ({
//         id: item.id,
//         cancel_id: item.cancel_id,
//         article_sku: item.article_sku,
//         quantity: item.quantity,
//         cancel_quantity: item.cancel_quantity,
//         created_at: item.created_at,
//         updated_at: item.updated_at,
//       }));
//     } catch (error) {
//       console.error("❌ Error in getCancelOrderItems:", error);
//       throw new Error(`Failed to fetch items for order: ${orderNumber}`);
//     }
//   });
// };

// // ==========================================
// // CREATE CANCEL ORDER
// // ==========================================
// export const createCancel = async (
//   orderNumber: string,
//   items: CancelOrderItem[],
//   user_id: number
// ): Promise<InsertCancelResult> => {
//   return withTransaction(async (connection) => {
//     // Step 1: Verify user exists
//     const [userRows] = await connection.query<RowDataPacket[]>(
//       `SELECT user_id, username FROM users WHERE user_id = ? LIMIT 1`,
//       [user_id]
//     );

//     if (!userRows?.length) {
//       return { success: false, message: `User not found with ID: ${user_id}` };
//     }

//     const username = userRows[0].username;

//     // Step 2: Check if order exists
//     const [orderRows] = await connection.query<RowDataPacket[]>(
//       `SELECT * FROM logistic_order WHERE order_number = ? LIMIT 1`,
//       [orderNumber]
//     );

//     if (!orderRows?.length) {
//       return { success: false, message: `Order not found: ${orderNumber}` };
//     }

//     const order = orderRows[0];

//     // Step 3: Check if cancel already exists
//     const [existingCancel] = await connection.query<RowDataPacket[]>(
//       `SELECT id FROM cancels_order WHERE order_number = ? LIMIT 1`,
//       [orderNumber]
//     );

//     if (existingCancel?.length) {
//       return {
//         success: false,
//         message: `Cancel order already exists for: ${orderNumber}`,
//       };
//     }

//     // Step 4: Validate all items exist in order
//     for (const item of items) {
//       const [orderItems] = await connection.query<RowDataPacket[]>(
//         `SELECT quantity FROM logistic_order_items
//      WHERE order_number = ? AND slmdl_articleordernumber = ? LIMIT 1`,
//         [orderNumber, item.slmdl_articleordernumber]
//       );

//       if (!orderItems?.length) {
//         return {
//           success: false,
//           message: `Article ${item.slmdl_articleordernumber} not found in order ${orderNumber}`,
//         };
//       }

//       if (item.cancelQuantity > orderItems[0].quantity) {
//         return {
//           success: false,
//           message: `Cancel quantity (${item.cancelQuantity}) exceeds order quantity (${orderItems[0].quantity}) for article ${item.slmdl_articleordernumber}`,
//         };
//       }
//     }

//     // Step 5: Insert cancel order
//     const [cancelOrderResult] = await connection.query<ResultSetHeader>(
//       `INSERT INTO cancels_order (
//         order_id, shopware_order_id, order_number, customer_id, invoice_amount,
//         payment_id, warehouse_id, order_time, expected_delivery_time,
//         customer_number, firstname, lastname, email, street, zipcode, city,
//         phone, latitude, longitude, status, article_sku, tracking_code,
//         order_status_id, user_id, created_at, updated_at
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         order.order_id,
//         order.shopware_order_id,
//         order.order_number,
//         order.customer_id,
//         order.invoice_amount,
//         order.payment_id,
//         order.warehouse_id,
//         order.order_time,
//         order.expected_delivery_time,
//         order.customer_number,
//         order.firstname,
//         order.lastname,
//         order.email,
//         order.street,
//         order.zipcode,
//         order.city,
//         order.phone,
//         order.latitude,
//         order.longitude,
//         "cancelled",
//         order.article_sku,
//         order.tracking_code,
//         order.order_status_id,
//         user_id,
//       ]
//     );

//     const cancelId = cancelOrderResult.insertId;

//     // Step 6: Insert cancel items (parallel for better performance)
//     const insertedItemIds = await Promise.all(
//       items.map(async (item) => {
//         const [result] = await connection.query<ResultSetHeader>(
//           `INSERT INTO cancels_order_items (cancel_id, article_sku, quantity, cancel_quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, NOW(), NOW())`,
//           [
//             cancelId,
//             item.slmdl_articleordernumber,
//             item.quantity,
//             item.cancelQuantity,
//           ]
//         );
//         return result.insertId;
//       })
//     );

//     // Step 7: Update original order status
//     await connection.query(
//       `UPDATE logistic_order SET status = 'cancelled', updated_at = NOW() WHERE order_number = ?`,
//       [orderNumber]
//     );

//     return {
//       success: true,
//       message: `Cancel order created successfully by ${username}`,
//       cancelId,
//       insertedItemIds,
//     };
//   });
// };

// // ==========================================
// // UPDATE CANCEL ITEM
// // ==========================================
// export const updateCancel = async (
//   id: number,
//   data: { cancel_quantity: number }
// ): Promise<ServiceResult> => {
//   return withConnection(async (connection) => {
//     const [items] = await connection.query<RowDataPacket[]>(
//       `SELECT quantity FROM cancels_order_items WHERE id = ?`,
//       [id]
//     );

//     if (!items?.length) {
//       return { success: false, message: "Cancel item not found" };
//     }

//     if (data.cancel_quantity > items[0].quantity) {
//       return {
//         success: false,
//         message: `Cancel quantity (${data.cancel_quantity}) cannot exceed original quantity (${items[0].quantity})`,
//       };
//     }

//     if (data.cancel_quantity <= 0) {
//       return {
//         success: false,
//         message: "Cancel quantity must be greater than 0",
//       };
//     }

//     const [result] = await connection.query<ResultSetHeader>(
//       `UPDATE cancels_order_items SET cancel_quantity = ?, updated_at = NOW() WHERE id = ?`,
//       [data.cancel_quantity, id]
//     );

//     return result.affectedRows > 0
//       ? { success: true, message: "Cancel item updated successfully" }
//       : { success: false, message: "Failed to update cancel item" };
//   });
// };

// // ==========================================
// // DELETE SINGLE CANCEL ITEM
// // ==========================================
// export const deleteCancel = async (id: number): Promise<ServiceResult> => {
//   return withTransaction(async (connection) => {
//     const [items] = await connection.query<RowDataPacket[]>(
//       `SELECT coi.cancel_id, co.order_number
//        FROM cancels_order_items coi
//        JOIN cancels_order co ON coi.cancel_id = co.id
//        WHERE coi.id = ?`,
//       [id]
//     );

//     if (!items?.length) {
//       return { success: false, message: "Cancel item not found" };
//     }

//     const { cancel_id: cancelId, order_number: orderNumber } = items[0];

//     await connection.query(`DELETE FROM cancels_order_items WHERE id = ?`, [
//       id,
//     ]);

//     const [remainingItems] = await connection.query<RowDataPacket[]>(
//       `SELECT COUNT(*) as count FROM cancels_order_items WHERE cancel_id = ?`,
//       [cancelId]
//     );

//     if (remainingItems[0].count === 0) {
//       await connection.query(
//         `UPDATE logistic_order SET status = 'delivered', updated_at = NOW() WHERE order_number = ?`,
//         [orderNumber]
//       );
//       await connection.query(`DELETE FROM cancels_order WHERE id = ?`, [
//         cancelId,
//       ]);
//     }

//     return { success: true, message: "Cancel item deleted successfully" };
//   });
// };

// // ==========================================
// // DELETE ALL CANCELS
// // ==========================================
// export const deleteAllCancels = async (): Promise<DeleteAllResult> => {
//   return withTransaction(async (connection) => {
//     const [cancelOrders] = await connection.query<RowDataPacket[]>(
//       `SELECT order_number FROM cancels_order`
//     );

//     if (cancelOrders?.length) {
//       const orderNumbers = cancelOrders.map((order) => order.order_number);
//       await connection.query(
//         `UPDATE logistic_order SET status = 'delivered', updated_at = NOW() WHERE order_number IN (?)`,
//         [orderNumbers]
//       );
//     }

//     await connection.query(`DELETE FROM cancels_order_items`);
//     const [result] = await connection.query<ResultSetHeader>(
//       `DELETE FROM cancels_order`
//     );

//     return {
//       success: true,
//       message: "All cancels deleted successfully",
//       deletedCount: result.affectedRows,
//     };
//   });
// };
