import pool from "../config/database";

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

// ✅ 2. Create a new return (insert into both tables)
export const createReturn = async (data: {
  order_id?: number;
  shopware_order_id?: number;
  order_number: string;
  customer_id: string;
  warehouse_id?: number;
  article_items: {
    article_sku: string;
    quantity: number;
    return_quantity: number;
  }[];
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert into returns_order
    const [result]: any = await connection.query(
      `
      INSERT INTO returns_order (
        order_id, shopware_order_id, order_number, customer_id, warehouse_id
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.order_id ?? null,
        data.shopware_order_id ?? null,
        data.order_number,
        data.customer_id,
        data.warehouse_id ?? null,
      ]
    );

    const returnId = result.insertId;

    // Insert items (batch insert)
    const items = data.article_items.map((item) => [
      returnId,
      item.article_sku,
      item.quantity,
      item.return_quantity,
    ]);

    await connection.query(
      `
      INSERT INTO returns_order_items 
      (return_id, article_sku, quantity, return_quantity)
      VALUES ?
      `,
      [items]
    );

    await connection.commit();
    return { success: true, message: "Return created successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
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
