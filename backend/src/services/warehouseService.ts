import pool from "../database";

interface Warehouse {
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: number;
  address: string;
  email: string;
  is_active: boolean;
}
export const getAllWarehouses = async () => {
  const [rows] = await pool.query("SELECT * FROM warehouse_details");
  return rows;
};

export const getWarehouseById = async (id: number) => {
  const [rows]: any = await pool.query(
    `SELECT * FROM warehouse_details WHERE warehouse_id = ?`,
    [id]
  );
  return rows[0];
};

export const getWarehouseWithVehiclesById = async (id: number) => {
    console.log("-------------------------------- STEP 3 GETTING WAREHOUSE WITH VEHICLES  ----------------------------------------------------")

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
    console.log("warehouse found:", rows);
    console.log("-------------------------------------------------------------------------------------------------------------------")
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
export const updateWarehouse = async (id: number, warehouse: Warehouse): Promise<boolean> => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE warehouse_details 
       SET clerk_name = ?, clerk_mob = ?, address = ?, email = ?, is_active = ? 
       WHERE warehouse_id = ?`,
      [
        warehouse.clerk_name,
        warehouse.clerk_mob,
        warehouse.address,
        warehouse.email,
        warehouse.is_active,
        id,
      ]
    );

    await connection.commit();
    return (result as any).affectedRows > 0; // cast because query result type can vary
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

// Disable single warehouse
export const disableWarehouse = async (
  id: number
): Promise<{ status: "success" | "warning" | "error"; message: string; data?: any }> => {
  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: `Invalid warehouse ID: ${id}` };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check current state
    const [rows]: any = await connection.query(
      "SELECT is_active,warehouse_name FROM warehouse_details WHERE warehouse_id = ?",
      [id]
    );
    const warehouse_name=rows[0].warehouse_name
    if (rows.length === 0) {
      await connection.rollback();
      return { status: "error", message: `Warehouse ID -  ${id} not found` };
    }

    if (rows[0].is_active === 0) {
      await connection.rollback();
      return { status: "warning", message: `Warehouse ID -  ${id} (${warehouse_name})  is already inactive` };
    }

    // Update if active
    const [result]: any = await connection.query(
      "UPDATE warehouse_details SET is_active = 0, updated_at = NOW() WHERE warehouse_id = ?",
      [id]
    );

    await connection.commit();
    return {
      status: result.affectedRows > 0 ? "success" : "error",
      message:
        result.affectedRows > 0
          ? `Warehouse ID - ${id} disabled successfully`
          : `Failed to disable warehouse ${id}`,
      data: { warehouseId: id, status: "disabled" },
    };
  } catch (err) {
    if (connection) await connection.rollback();
    return {
      status: "error",
      message: `Failed to disable warehouse ${id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  } finally {
    if (connection) connection.release();
  }
};

// Disable multiple warehouses
export const disableMultipleWarehouses = async (
  ids: number[]
): Promise<{ status: "success" | "warning" | "error"; message: string; data?: any }> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { status: "error", message: "'ids' must be a non-empty array of numbers" };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check current states
    const [rows]: any = await connection.query(
      `SELECT warehouse_id, is_active FROM warehouse_details WHERE warehouse_id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return { status: "error", message: "No warehouses found with the provided IDs" };
    }

    const activeIds = rows.filter((r: any) => r.is_active === 1).map((r: any) => r.warehouse_id);
    const inactiveCount = rows.filter((r: any) => r.is_active === 0).length;

    if (activeIds.length === 0) {
      await connection.rollback();
      return {
        status: "warning",
        message: "All provided warehouses are already inactive",
        data: { requestedIds: ids, alreadyInactive: inactiveCount },
      };
    }

    // Disable active warehouses
    const [result]: any = await connection.query(
      `UPDATE warehouse_details SET is_active = 0, updated_at = NOW() WHERE warehouse_id IN (?)`,
      [activeIds]
    );

    await connection.commit();
    return {
      status: "success",
      message: `${result.affectedRows} of ${ids.length} warehouses disabled (Already inactive: ${inactiveCount})`,
      data: {
        requestedIds: ids,
        affectedCount: result.affectedRows,
        alreadyInactive: inactiveCount,
        status: "disabled",
      },
    };
  } catch (err) {
    if (connection) await connection.rollback();
    return {
      status: "error",
      message: `Failed to disable warehouses: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    if (connection) connection.release();
  }
};
