import pool from "../database";
import { WarehouseDetailsDto } from "../types/dto.types";
import { LocationMeta } from "../types/tour.types";
import { Warehouse, WarehouseZipcodes } from "../types/warehouse.types";
import { geocode } from "./hereMap.service";

export const getAllWarehouses = async () => {
  const [rows] = await pool.query("SELECT * FROM warehouse_details");
  return rows;
};

export const getWarehouseById = async (
  id: number
): Promise<WarehouseDetailsDto> => {
  const [rows]: any = await pool.query(
    `SELECT * FROM warehouse_details WHERE warehouse_id = ?`,
    [id]
  );

  const row = rows[0];
  const warehouse: WarehouseDetailsDto = {
    id: row.warehouse_id,
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

export const getWarehouseWithVehicles = async (
  id: number
): Promise<Warehouse> => {
  const [rows]: any = await pool.execute(
    `SELECT
       wd.*
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

  if (!rows.length) {
    throw new Error("Warehouse not found");
  }
  return {
    id: rows[0].warehouse_id,
    name: rows[0].warehouse_name,
    clerkName: rows[0].clerk_name,
    clerkMob: rows[0].clerk_mob,
    address: rows[0].address,
    zipcode: rows[0].zip_code,
    town: rows[0].town,
    colorCode: rows[0].color_code,
    zip_codes_delivering: rows[0].zip_codes_delivering,
    email: rows[0].email,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
    updatedBy: rows[0].updated_by,
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

export const getActiveWarehousesWithVehicles = async (): Promise<
  Warehouse[]
> => {
  const [rows]: any = await pool.execute(
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
     WHERE wd.is_active = 1`
  );

  if (!rows.length) return [];

  const warehouses = new Map<number, any>();

  for (const row of rows) {
    if (!warehouses.has(row.warehouse_id)) {
      warehouses.set(row.warehouse_id, {
        id: row.warehouse_id as number,
        name: row.warehouse_name,
        clerkName: row.clerk_name,
        clerkMob: row.clerk_mob,
        address: row.address,
        email: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        vehicles: [],
      });
    }

    if (row.vehicle_id) {
      warehouses.get(row.warehouse_id).vehicles.push({
        id: row.vehicle_id,
        capacity: row.capacity,
        licensePlate: row.license_plate,
        driverId: row.driver_id,
      });
    }
  }

  return Array.from(warehouses.values());
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
  warehouse: Warehouse
): Promise<boolean> => {
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
): Promise<{
  status: "success" | "warning" | "error";
  message: string;
  data?: any;
}> => {
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
    const warehouse_name = rows[0].warehouse_name;
    if (rows.length === 0) {
      await connection.rollback();
      return { status: "error", message: `Warehouse ID -  ${id} not found` };
    }

    if (rows[0].is_active === 0) {
      await connection.rollback();
      return {
        status: "warning",
        message: `Warehouse ID -  ${id} (${warehouse_name})  is already inactive`,
      };
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
): Promise<{
  status: "success" | "warning" | "error";
  message: string;
  data?: any;
}> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      status: "error",
      message: "'ids' must be a non-empty array of numbers",
    };
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
      return {
        status: "error",
        message: "No warehouses found with the provided IDs",
      };
    }

    const activeIds = rows
      .filter((r: any) => r.is_active === 1)
      .map((r: any) => r.warehouse_id);
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
      message: `Failed to disable warehouses: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  } finally {
    if (connection) connection.release();
  }
};

export const getWarehouseZipcodesRecord = async (
  ids: number[] | number
): Promise<Record<number, WarehouseZipcodes> | null> => {
  const idArray = Array.isArray(ids) ? ids : [ids];
  if (idArray.length === 0) return null;

  const placeholders = idArray.map(() => "?").join(",");

  const [rows]: any = await pool.execute(
    `SELECT
       warehouse_id,
       warehouse_name AS name,
       town,
       zip_codes_delivering
     FROM warehouse_details
     WHERE warehouse_id IN (${placeholders})`,
    idArray
  );

  if (!rows.length) return null;

  const result: Record<number, WarehouseZipcodes> = {};

  for (const row of rows) {
    const zipstring = row.zip_codes_delivering || "";
    const zipcodes: number[] = zipstring
      .split(",")
      .map((z: string) => z.trim())
      .filter(Boolean)
      .map(Number);

    result[row.warehouse_id] = {
      warehouse_id: row.warehouse_id,
      name: row.name,
      town: row.town,
      zip_codes_delivering: [...new Set(zipcodes)],
    };
  }

  return result;
};

// export const estimateWarehouseDeliveryTimes = async (warehouseId: number) => {
//   // 1. Fetch warehouse + zipcodes
//   const warehouses = await getWarehouseZipcodes(warehouseId);
//   if (!warehouses || !warehouses[warehouseId]) throw new Error("Warehouse not found");

//   const { zip_codes_delivering } = warehouses[warehouseId];

//   // 2. Geocode zipcodes into coordinates
//   const destinations: LocationMeta[] = [];
//   for (const zip of zip_codes_delivering) {
//     const coord = await geocode(zip.toString());
//     if (coord) destinations.push(coord);
//   }

//   // 3. Assume warehouse location is already geocoded (or stored in DB)
//   // Example: get it from `warehouse_details`
//   const origin: Coordinate = { lat: 25.276987, lng: 55.296249 }; // Dubai warehouse

//   // 4. Call HERE Matrix
//   const result = await matrixEstimate([origin], destinations, "car");

//   return result;
// };
