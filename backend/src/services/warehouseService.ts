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
  
  try {
    await pool.query('START TRANSACTION');
    const [result]: any = await pool.query(
      "INSERT INTO warehouse_details (warehouse_name, clerk_name, clerk_mob, address, email) VALUES (?, ?, ?, ?, ?)",
      [
        warehouse.warehouse_name,
        warehouse.clerk_name,
        warehouse.clerk_mob,
        warehouse.address,
        warehouse.email,
      ]
    );
    await pool.query('COMMIT');
    return { warehouse_id: result.insertId, ...warehouse };
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
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
  
  try {
    await pool.query('START TRANSACTION');
    const [result]: any = await pool.query(
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
    await pool.query('COMMIT');
    return result.affectedRows > 0;
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
};

export const deleteWarehouse = async (id: number) => {
 
  try {
    await pool.query('START TRANSACTION');
    const [result]: any = await pool.query("DELETE FROM warehouse_details WHERE warehouse_id = ?", [id]);
    await pool.query('COMMIT');
    return result.affectedRows > 0;
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};

export const deleteMultipleWarehouses = async (ids: number[]) => {
 
  try {
    const placeholders = ids.map(() => "?").join(",");
    const [result]: any = await pool.query(
      `DELETE FROM warehouse_details WHERE warehouse_id IN (${placeholders})`,
      ids
    );
    await pool.query('COMMIT');
    return result.affectedRows;
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};
