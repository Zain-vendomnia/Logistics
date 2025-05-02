import pool from "../database";

export const getAllDrivers = async () => {
  const [rows] = await pool.query("SELECT * FROM driver_details");
  return rows;
};

export const getDriverById = async (id: number) => {
  const [rows]: any = await pool.query("SELECT * FROM driver_details WHERE id = ?", [id]);
  return rows[0];
};

export const createDriver = async (driver: {
  name: string;
  mob: number;
  address: string;
  warehouse_id: number;
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query(
      "INSERT INTO driver_details (name, mob, address, warehouse_id) VALUES (?, ?, ?, ?)",
      [driver.name, driver.mob, driver.address, driver.warehouse_id]
    );
    await conn.commit();
    return { id: result.insertId, ...driver };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateDriver = async (id: number, driver: {
  name: string;
  mob: number;
  address: string;
  warehouse_id: number;
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query(
      "UPDATE driver_details SET name = ?, mob = ?, address = ?, warehouse_id = ? WHERE id = ?",
      [driver.name, driver.mob, driver.address, driver.warehouse_id, id]
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

export const deleteDriver = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result]: any = await conn.query("DELETE FROM driver_details WHERE id = ?", [id]);
    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteMultipleDrivers = async (ids: number[]) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const placeholders = ids.map(() => "?").join(",");
    const [result]: any = await conn.query(
      `DELETE FROM driver_details WHERE id IN (${placeholders})`,
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
