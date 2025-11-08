import pool from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

/**
 * Interface for cancel item
 */
interface CancelItem {
  id: number;
  order_id?: number | null;
  order_number: string;
  slmdl_articleordernumber: string;
  quantity: number;
  cancelQuantity: number;
  warehouse_id?: string | null;
}

/**
 * Interface for service response
 */
interface InsertCancelResult {
  success: boolean;
  message: string;
  cancelId?: number;
  insertedItemIds?: number[];
}

// ✅ 1. Get all cancel records (joined data)
export const getAllCancels = async () => {
  const [rows]: any = await pool.query(
    `
    SELECT 
      co.id,
      co.order_number,
      coi.article_sku,
      coi.quantity AS original_quantity,
      coi.cancel_quantity,
      coi.created_at
    FROM cancels_order_items coi
    JOIN cancels_order co ON co.id = coi.cancel_id
    ORDER BY coi.created_at DESC;
    `
  );
  return rows;
};

// ✅ 2. Create a new cancel (Updated with complete logic from individual service)
/**
 * Insert cancel details into cancels_order and cancels_order_items tables
 * @param orderNumber - The order number
 * @param items - Array of cancel items
 * @returns Result with success status and inserted IDs
 */
export const createCancel = async (
  orderNumber: string,
  items: CancelItem[]
): Promise<InsertCancelResult> => {
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();

    // Step 1: Fetch order details from logistic_order table
    const fetchOrderSql = `
      SELECT 
        order_id,
        shopware_order_id,
        order_number,
        customer_id,
        invoice_amount,
        payment_id,
        warehouse_id,
        order_time,
        expected_delivery_time,
        customer_number,
        firstname,
        lastname,
        email,
        street,
        zipcode,
        city,
        phone,
        latitude,
        longitude,
        status,
        article_sku,
        tracking_code,
        order_status_id
      FROM logistic_order
      WHERE order_number = ?
      LIMIT 1
    `;

    const [orderRows] = await connection.query<RowDataPacket[]>(
      fetchOrderSql,
      [orderNumber]
    );

    if (!orderRows || orderRows.length === 0) {
      await connection.rollback();
      return {
        success: false,
        message: `Order not found with order number: ${orderNumber}`,
      };
    }

    const orderData = orderRows[0];

    // Step 2: Insert into cancels_order table
    const insertCancelOrderSql = `
      INSERT INTO cancels_order (
        order_id,
        shopware_order_id,
        order_number,
        customer_id,
        invoice_amount,
        payment_id,
        warehouse_id,
        order_time,
        expected_delivery_time,
        customer_number,
        firstname,
        lastname,
        email,
        street,
        zipcode,
        city,
        phone,
        latitude,
        longitude,
        status,
        article_sku,
        tracking_code,
        order_status_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const cancelOrderValues = [
      orderData.order_id,
      orderData.shopware_order_id,
      orderData.order_number,
      orderData.customer_id,
      orderData.invoice_amount,
      orderData.payment_id,
      orderData.warehouse_id,
      orderData.order_time,
      orderData.expected_delivery_time,
      orderData.customer_number,
      orderData.firstname,
      orderData.lastname,
      orderData.email,
      orderData.street,
      orderData.zipcode,
      orderData.city,
      orderData.phone,
      orderData.latitude,
      orderData.longitude,
      orderData.status,
      orderData.article_sku,
      orderData.tracking_code,
      orderData.order_status_id,
    ];

    const [cancelOrderResult] = await connection.query<ResultSetHeader>(
      insertCancelOrderSql,
      cancelOrderValues
    );

    const cancelId = cancelOrderResult.insertId;

    if (!cancelId) {
      await connection.rollback();
      return {
        success: false,
        message: "Failed to insert into cancels_order table",
      };
    }

    console.log(`✅ Inserted cancel_id: ${cancelId} into cancels_order table`);

    // Step 3: Insert into cancels_order_items table
    const insertCancelItemSql = `
      INSERT INTO cancels_order_items (
        cancel_id,
        article_sku,
        quantity,
        cancel_quantity
      ) VALUES (?, ?, ?, ?)
    `;

    const insertedItemIds: number[] = [];

    for (const item of items) {
      const itemValues = [
        cancelId,
        item.slmdl_articleordernumber,
        item.quantity,
        item.cancelQuantity,
      ];

      const [itemResult] = await connection.query<ResultSetHeader>(
        insertCancelItemSql,
        itemValues
      );

      if (itemResult.insertId) {
        insertedItemIds.push(itemResult.insertId);
      }
    }

    // Commit transaction
    await connection.commit();

    console.log(
      `✅ Successfully inserted cancel_id: ${cancelId} with ${insertedItemIds.length} item(s)`
    );

    return {
      success: true,
      message: `Successfully created cancel with ${insertedItemIds.length} item(s)`,
      cancelId,
      insertedItemIds,
    };
  } catch (error: any) {
    // Rollback on error
    await connection.rollback();
    console.error("❌ Error inserting cancel details:", error);

    return {
      success: false,
      message: error.message || "Database transaction failed while inserting cancel details.",
    };
  } finally {
    // Release connection back to pool
    connection.release();
  }
};

// ✅ 3. Update cancel_quantity for a specific item
export const updateCancel = async (
  id: number,
  data: { cancel_quantity: number }
) => {
  const [result]: any = await pool.query(
    `
    UPDATE cancels_order_items
    SET cancel_quantity = ?, updated_at = NOW()
    WHERE id = ?
    `,
    [data.cancel_quantity, id]
  );
  return {
    success: result.affectedRows > 0,
    message:
      result.affectedRows > 0
        ? "Cancel quantity updated successfully"
        : "No record found to update",
  };
};

// ✅ 4. Delete single cancel (from both tables)
export const deleteCancel = async (cancelId: number) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete child first
    await connection.query(
      `DELETE FROM cancels_order_items WHERE cancel_id = ?`,
      [cancelId]
    );

    // Then parent
    await connection.query(`DELETE FROM cancels_order WHERE cancel_id = ?`, [
      cancelId,
    ]);

    await connection.commit();
    return { success: true, message: `Cancel ID ${cancelId} deleted` };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ✅ 5. Delete all cancels (from both tables)
export const deleteAllCancels = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`DELETE FROM cancels_order_items`);
    await connection.query(`DELETE FROM cancels_order`);

    await connection.commit();
    return { success: true, message: "All cancels deleted successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Fetch all cancels for a given order number (optional - for future use)
 * @param orderNumber - The order number
 * @returns Array of cancel items with order details
 */
export const fetchCancelsByOrderNumber = async (
  orderNumber: string
): Promise<any[]> => {
  try {
    const sql = `
      SELECT 
        co.*,
        coi.item_id,
        coi.article_sku,
        coi.quantity,
        coi.cancel_quantity,
        coi.warehouse_id as item_warehouse_id,
        coi.created_at as item_created_at
      FROM cancels_order co
      LEFT JOIN cancels_order_items coi ON co.cancel_id = coi.cancel_id
      WHERE co.order_number = ?
      ORDER BY co.created_at DESC, coi.item_id ASC
    `;

    const [rows] = await pool.query(sql, [orderNumber]);

    return rows as any[];
  } catch (error: any) {
    console.error("❌ Error fetching cancels:", error);
    throw new Error("Database query failed while fetching cancels.");
  }
};