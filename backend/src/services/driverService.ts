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
  email: string;
  warehouse_id: number;
}) => {
 
  try {
    await pool.query('START TRANSACTION');

    // Check if the email already exists
    const [existingEmail]: any = await pool.query(
      `SELECT id FROM driver_details WHERE email = ?`,
      [driver.email]
    );

    if (existingEmail.length > 0) {
      await pool.query('ROLLBACK');
      return { error: true, message: "Email already exists" };
    }

    // Proceed with insertion
    const [result]: any = await pool.query(
      `INSERT INTO driver_details (name, mob, address, email, warehouse_id) VALUES (?, ?, ?, ?, ?)`,
      [driver.name, driver.mob, driver.address, driver.email, driver.warehouse_id]
    );

    await pool.query('COMMIT');
    return { id: result.insertId, ...driver };
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};


export const updateDriver = async (
  id: number,
  driver: {
    name: string;
    mob: number;
    address: string;
    email: string;
    warehouse_id: number;
  }
) => {
  
  try {
    await pool.query('START TRANSACTION');

    // Check if email exists for another driver
    const [existing]: any = await pool.query(
      `SELECT id FROM driver_details WHERE email = ? AND id != ?`,
      [driver.email, id]
    );
    console.log(existing, "existing email check");
    console.log(existing.length, "existing email check length");
    if (existing.length > 0) {
      console.log("Email already exists for another driver");
      await pool.query('ROLLBACK');
      return { error: true, message: "Email already exists" };
    }

    const [result]: any = await pool.query(
      `UPDATE driver_details SET name = ?, mob = ?, address = ?, email = ?, warehouse_id = ? WHERE id = ?`,
      [
        driver.name,
        driver.mob,
        driver.address,
        driver.email,
        driver.warehouse_id,
        id
      ]
    );

    await pool.query('COMMIT');
    return { success: result.affectedRows > 0 };
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};



export const deleteDriver = async (id: number) => {
   try {
    await pool.query('START TRANSACTION');
    const [result]: any = await pool.query("DELETE FROM driver_details WHERE id = ?", [id]);
    await pool.query('COMMIT');
    return result.affectedRows > 0;
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};

export const deleteMultipleDrivers = async (ids: number[]) => {
   try {
    await pool.query('START TRANSACTION');
    const placeholders = ids.map(() => "?").join(",");
    const [result]: any = await pool.query(
      `DELETE FROM driver_details WHERE id IN (${placeholders})`,
      ids
    );
    await pool.query('COMMIT');
    return result.affectedRows;
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } 
};
