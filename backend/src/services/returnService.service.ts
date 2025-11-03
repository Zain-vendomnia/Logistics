import pool from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

/**
 * Interface for return item
 */
interface ReturnItem {
  id: number;
  order_id?: number | null;
  order_number: string;
  slmdl_articleordernumber: string;
  quantity: number;
  returnQuantity: number;
  warehouse_id?: string | null;
}

/**
 * Interface for service response
 */
interface InsertReturnResult {
  success: boolean;
  message: string;
  returnId?: number;
  insertedItemIds?: number[];
}

// ✅ 1. Get all return records (joined data)
export const getAllReturns = async () => {
  const [rows]: any = await pool.query(
    `
    SELECT 
      ro.return_id,
      ro.order_number,
      roi.article_sku,
      roi.quantity AS original_quantity,
      roi.return_quantity,
      roi.created_at
    FROM returns_order_items roi
    JOIN returns_order ro ON ro.return_id = roi.return_id
    ORDER BY roi.created_at DESC;
    `
  );
  return rows;
};

// ✅ 2. Create a new return (Updated with complete logic from individual service)
/**
 * Insert return details into returns_order and returns_order_items tables
 * @param orderNumber - The order number
 * @param items - Array of return items
 * @returns Result with success status and inserted IDs
 */
export const createReturn = async (
  orderNumber: string,
  items: ReturnItem[]
): Promise<InsertReturnResult> => {
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

    // Step 2: Insert into returns_order table
    const insertReturnOrderSql = `
      INSERT INTO returns_order (
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

    const returnOrderValues = [
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

    const [returnOrderResult] = await connection.query<ResultSetHeader>(
      insertReturnOrderSql,
      returnOrderValues
    );

    const returnId = returnOrderResult.insertId;

    if (!returnId) {
      await connection.rollback();
      return {
        success: false,
        message: "Failed to insert into returns_order table",
      };
    }

    console.log(`✅ Inserted return_id: ${returnId} into returns_order table`);

    // Step 3: Insert into returns_order_items table
    const insertReturnItemSql = `
      INSERT INTO returns_order_items (
        return_id,
        article_sku,
        quantity,
        return_quantity
      ) VALUES (?, ?, ?, ?)
    `;

    const insertedItemIds: number[] = [];

    for (const item of items) {
      const itemValues = [
        returnId,
        item.slmdl_articleordernumber,
        item.quantity,
        item.returnQuantity,
      ];

      const [itemResult] = await connection.query<ResultSetHeader>(
        insertReturnItemSql,
        itemValues
      );

      if (itemResult.insertId) {
        insertedItemIds.push(itemResult.insertId);
      }
    }

    // Commit transaction
    await connection.commit();

    console.log(
      `✅ Successfully inserted return_id: ${returnId} with ${insertedItemIds.length} item(s)`
    );

    return {
      success: true,
      message: `Successfully created return with ${insertedItemIds.length} item(s)`,
      returnId,
      insertedItemIds,
    };
  } catch (error: any) {
    // Rollback on error
    await connection.rollback();
    console.error("❌ Error inserting return details:", error);

    return {
      success: false,
      message: error.message || "Database transaction failed while inserting return details.",
    };
  } finally {
    // Release connection back to pool
    connection.release();
  }
};

// ✅ 3. Update return_quantity for a specific item
export const updateReturn = async (
  id: number,
  data: { return_quantity: number }
) => {
  const [result]: any = await pool.query(
    `
    UPDATE returns_order_items
    SET return_quantity = ?, updated_at = NOW()
    WHERE id = ?
    `,
    [data.return_quantity, id]
  );
  return {
    success: result.affectedRows > 0,
    message:
      result.affectedRows > 0
        ? "Return quantity updated successfully"
        : "No record found to update",
  };
};

// ✅ 4. Delete single return (from both tables)
export const deleteReturn = async (returnId: number) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete child first
    await connection.query(
      `DELETE FROM returns_order_items WHERE return_id = ?`,
      [returnId]
    );

    // Then parent
    await connection.query(`DELETE FROM returns_order WHERE return_id = ?`, [
      returnId,
    ]);

    await connection.commit();
    return { success: true, message: `Return ID ${returnId} deleted` };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ✅ 5. Delete all returns (from both tables)
export const deleteAllReturns = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`DELETE FROM returns_order_items`);
    await connection.query(`DELETE FROM returns_order`);

    await connection.commit();
    return { success: true, message: "All returns deleted successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Fetch all returns for a given order number (optional - for future use)
 * @param orderNumber - The order number
 * @returns Array of return items with order details
 */
export const fetchReturnsByOrderNumber = async (
  orderNumber: string
): Promise<any[]> => {
  try {
    const sql = `
      SELECT 
        ro.*,
        roi.item_id,
        roi.article_sku,
        roi.quantity,
        roi.return_quantity,
        roi.warehouse_id as item_warehouse_id,
        roi.created_at as item_created_at
      FROM returns_order ro
      LEFT JOIN returns_order_items roi ON ro.return_id = roi.return_id
      WHERE ro.order_number = ?
      ORDER BY ro.created_at DESC, roi.item_id ASC
    `;

    const [rows] = await pool.query(sql, [orderNumber]);

    return rows as any[];
  } catch (error: any) {
    console.error("❌ Error fetching returns:", error);
    throw new Error("Database query failed while fetching returns.");
  }
};