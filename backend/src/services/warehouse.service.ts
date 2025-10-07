import pool from "../config/database";
import { geocode, matrixEstimate } from "./hereMap.service";

import { WarehouseDetailsDto } from "../types/dto.types";
import { Warehouse, WarehouseZipcodes } from "../types/warehouse.types";
import { Location, MatrixData, MatrixResult } from "../types/hereMap.types";
import { Order } from "../types/order.types";

import { logWithTime } from "../utils/logging";

export const getAllWarehouses = async (): Promise<Warehouse[]> => {
  const [rows] = await pool.query("SELECT * FROM warehouse_details");

  if (!rows || (rows as any[]).length === 0)
    throw new Error("No warehouse exist in Database");

  const warehouses: Warehouse[] = (rows as any[]).map((row) => ({
    id: row.warehouse_id,
    ...row,
  }));

  return warehouses;
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
       wd.*,
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
    lat: rows[0].latitude,
    lng: rows[0].longitude,
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
       wd.*,
       vd.vehicle_id,
       vd.capacity,
       vd.license_plate,
       vd.driver_id
     FROM warehouse_details wd
     LEFT JOIN vehicle_details vd 
     ON wd.warehouse_id = vd.warehouse_id
     WHERE is_active = 1`
  );

  if (!rows.length) return [];

  const warehouses = new Map<number, any>();

  for (let i = 0; i < rows.length; i++) {
    if (!warehouses.has(rows[i].warehouse_id)) {
      warehouses.set(rows[i].warehouse_id, {
        id: rows[i].warehouse_id,
        name: rows[i].warehouse_name,
        clerkName: rows[i].clerk_name,
        clerkMob: rows[i].clerk_mob,
        address: rows[i].address,
        zipcode: rows[i].zip_code,
        town: rows[i].town,
        lat: rows[i].latitude,
        lng: rows[i].longitude,
        colorCode: rows[i].color_code,
        zip_codes_delivering: rows[i].zip_codes_delivering,
        email: rows[i].email,
        createdAt: rows[i].created_at,
        updatedAt: rows[i].updated_at,
        updatedBy: rows[i].updated_by,
        vehicles: [],
      });
    }

    if (rows[i].vehicle_id) {
      warehouses.get(rows[i].warehouse_id).vehicles.push({
        id: rows[i].vehicle_id,
        capacity: rows[i].capacity,
        licensePlate: rows[i].license_plate,
        driverId: rows[i].driver_id,
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
       SET warehouse_name = ?, address = ?, town = ?,
       latitude = ?, longitude = ?,
       zip_code = ?, zip_codes_delivering = ?, color_code = ?,
       clerk_name = ?, clerk_mob = ?, email = ?, is_active = ? 
       WHERE warehouse_id = ?`,
      [
        warehouse.name,
        warehouse.address,
        warehouse.town,
        warehouse.lat,
        warehouse.lng,
        warehouse.zipcode,
        warehouse.zip_codes_delivering,
        warehouse.colorCode,
        warehouse.clerk_name,
        warehouse.clerk_mob,
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

export async function getWarehouseLocationCords(
  warehouse: Warehouse
): Promise<Location | null> {
  try {
    const address = `${warehouse.address}, ${warehouse.town}`;
    console.log(
      `Calling HERE Map geocode() for Warehouse ${warehouse.id} address: ${address} `
    );

    const location: Location = await geocode(address);
    (warehouse.lat = location.lat), (warehouse.lng = location.lng);
    const isUpdated = await updateWarehouse(warehouse.id, warehouse);
    if (!isUpdated) {
      console.error(
        `Warehouse ${warehouse.id} update failed for Location: ${location}`
      );
      return null;
    }

    return location;
  } catch (error) {
    console.error(`Error`);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

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

export async function getWarehouseToOrdersMatrix(
  warehouse: Warehouse,
  orders: Order[]
): Promise<MatrixData | undefined> {
  try {
    const validOrders = orders.filter(
      (o) => o && o.location && o.location.lat != null && o.location.lng != null
    );

    if (!warehouse || !validOrders.length) {
      throw new Error(
        "matrixEstimate requires at least one Warehouse and one Order."
      );
    }

    console.log(`Begin Matrix Call --------------------- 1`);
    console.log(
      `Matrix Call: WH ${warehouse.id} - ${warehouse.town} for ${
        orders.length
      } Orders: ${orders.map((o) => o.order_id).join(",")}`
    );

    const destinations = validOrders.map((o) => ({
      lat: +o.location.lat,
      lng: +o.location.lng,
    }));

    if (!destinations.length) {
      throw new Error("No valid origins or destinations for matrix request.");
    }

    const origins = [
      {
        lat: +warehouse.lat!,
        lng: +warehouse.lng!,
      },
      ...destinations,
    ];

    const allDestinations = [
      ...destinations,
      {
        lat: +warehouse.lat!,
        lng: +warehouse.lng!,
      },
    ];

    const originBatches = [];
    for (let i = 0; i < origins.length; i += 15) {
      originBatches.push(origins.slice(i, i + 15));
    }

    let allTravelTimes: number[] = [];
    let allDistances: number[] = [];
    let allErrors: number[] = [];

    console.log(`Matrix Request send --------------------- 2`);
    for (const batch of originBatches) {
      const matrixRes = await callMatrixWithTimeout(batch, allDestinations);

      if (matrixRes && !matrixRes.error) {
        allTravelTimes.push(...matrixRes?.matrix.travelTimes);
        allDistances.push(...matrixRes?.matrix.distances);
      } else {
        console.error(
          `Matrix API returned error: ${JSON.stringify(matrixRes?.error)}`
        );
        allErrors.push(...(matrixRes?.matrix.errorCodes || []));

        return undefined;
      }
    }

    return {
      travelTimes: allTravelTimes,
      distances: allDistances,
      numOrigins: origins.length,
      numDestinations: allDestinations.length,
      errorCodes: allErrors.length ? allErrors : undefined,
    } as MatrixData;
  } catch (error) {
    logWithTime(`Error in Matrix API Call: ${error}`);
    throw error;
  }
}

async function callMatrixWithTimeout(
  batch: { lat: number; lng: number }[],
  allDestinations: { lat: number; lng: number }[],
  retries = 2,
  timeoutMs = 20000
): Promise<MatrixResult | undefined> {
  const matrixCall = async () => {
    const timeoutPromise = new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), timeoutMs)
    );

    const result = await Promise.race([
      matrixEstimate(batch, allDestinations),
      timeoutPromise,
    ]);

    return result;
  };

  for (let i = 0; i <= retries; i++) {
    try {
      const result = await matrixCall();
      if (result) return result;
    } catch (error) {
      console.error(`Matrix call failed on attempt ${i + 1}: ${error}`);

      if (i <= retries) {
        continue;
      } else {
        throw error;
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return undefined;
}
