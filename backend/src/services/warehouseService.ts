import pool from "../database";
import { WarehouseDetails } from "../types/dto.types";

export const getAllWarehouses = async () => {
  const [rows] = await pool.query("SELECT * FROM warehouse_details");
  return rows;
};

export const getWarehouseById = async (
  id: number
): Promise<WarehouseDetails> => {
  const [rows]: any = await pool.query(
    `SELECT * FROM warehouse_details WHERE warehouse_id = ?`,
    [id]
  );

  const row = rows[0];
  const warehouse: WarehouseDetails = {
    id: row.warehouse_details,
    name: row.warehouse_name,
    town: row.town,
    address: row.address,
    zipcode: row.zip_code,
    zip_codes_delivering: row.zip_codes_delivering,
    colorCode: row.color_code,
    email: row.email,
    clerkName: row.clerk_name,
    clerkMob: row.clerk_mob,
  };
  return warehouse;
};

export const getWarehouseWithVehiclesById = async (id: number) => {
  const [rows]: any = await pool.query(
    `SELECT
       wd.warehouse_id,
       wd.warehouse_name,
       wd.clerk_name,
       wd.clerk_mob,
       wd.address,
       wd.email,
       wd.created_at,
       wd.updated_at,
       vd.vehicle_id,
       vd.capacity,
       vd.license_plate,
       vd.driver_id
     FROM warehouse_details wd
     LEFT JOIN vehicle_details vd
     ON wd.warehouse_id = vd.warehouse_id
     WHERE wd.warehouse_id = ?`,
    [id]
  );

  if (!rows.length) return null;
  return {
    warehouse_id: rows[0].warehouse_id,
    warehouse_name: rows[0].warehouse_name,
    clerk_name: rows[0].clerk_name,
    clerk_mob: rows[0].clerk_mob,
    address: rows[0].address,
    email: rows[0].email,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at,
    vehicles: rows
      .filter((r: any) => r.vehicle_id !== null)
      .map((r: any) => ({
        vehicle_id: r.vehicle_id,
        capacity: r.capacity,
        license_plate: r.license_plate,
        driver_id: r.driver_id,
      })),
  };
};

export const createWarehouse = async (warehouse: {
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: number;
  address: string;
  email: string;
}) => {
  try {
    await pool.query("START TRANSACTION");
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
    await pool.query("COMMIT");
    return { warehouse_id: result.insertId, ...warehouse };
  } catch (err) {
    await pool.query("ROLLBACK");
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
    await pool.query("START TRANSACTION");
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
    await pool.query("COMMIT");
    return result.affectedRows > 0;
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
};

export const deleteWarehouse = async (id: number) => {
  try {
    await pool.query("START TRANSACTION");
    const [result]: any = await pool.query(
      "DELETE FROM warehouse_details WHERE warehouse_id = ?",
      [id]
    );
    await pool.query("COMMIT");
    return result.affectedRows > 0;
  } catch (err) {
    await pool.query("ROLLBACK");
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
    await pool.query("COMMIT");
    return result.affectedRows;
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
};
