import pool from "../database";

export const getAllWarehouses = async () => {
  const [rows] = await pool.query("SELECT * FROM warehouse_details");
  return rows;
};

export const getWarehouseById = async (id: number) => {
  const [rows]: any = await pool.query("SELECT * FROM warehouse_details WHERE warehouse_id = ?", [id]);
  return rows[0];
};

export const createWarehouse = async (warehouse: {
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: number;
  address: string;
  email: string;
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query(
      "INSERT INTO warehouse_details (warehouse_name, clerk_name, clerk_mob, address, email) VALUES (?, ?, ?, ?, ?)",
      [
        warehouse.warehouse_name,
        warehouse.clerk_name,
        warehouse.clerk_mob,
        warehouse.address,
        warehouse.email,
      ]
    );
    await conn.commit();
    return { warehouse_id: result.insertId, ...warehouse };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateWarehouse = async (
  id: number,
  warehouse: {
    warehouse_name: string;
    clerk_name: string;
    clerk_mob: number;
    address: string;
    email: string;
  }
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query(
      "UPDATE warehouse_details SET warehouse_name = ?, clerk_name = ?, clerk_mob = ?, address = ?, email = ? WHERE warehouse_id = ?",
      [
        warehouse.warehouse_name,
        warehouse.clerk_name,
        warehouse.clerk_mob,
        warehouse.address,
        warehouse.email,
        id,
      ]
    );
    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteWarehouse = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query("DELETE FROM warehouse_details WHERE warehouse_id = ?", [id]);
    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteMultipleWarehouses = async (ids: number[]) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const placeholders = ids.map(() => "?").join(",");
    const [result]: any = await conn.query(
      `DELETE FROM warehouse_details WHERE warehouse_id IN (${placeholders})`,
      ids
    );
    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
