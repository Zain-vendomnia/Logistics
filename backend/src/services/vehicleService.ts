// services/vehicleService.ts
import pool from "../database";

/** ---------- Uniform response helpers ---------- */
type ServiceResponse<T = unknown> = {
  success: boolean;
  code: string;            // "OK" on success; error code on failure
  message?: string;        // optional human-friendly message
  data?: T;                // payload on success
};

const ok = <T = unknown>(data?: T, message = "OK"): ServiceResponse<T> => ({
  success: true,
  code: "OK",
  message,
  data,
});

const fail = (code: string, message: string): ServiceResponse<never> => ({
  success: false,
  code,
  message,
});

/** ---------- Standardized service error ---------- */
export class ServiceError extends Error {
  status: number;
  code?: string;
  details?: any;
  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const nowIso = () => new Date().toISOString();

const logDbError = (fn: string, err: any, meta?: Record<string, any>) => {
  console.error(
    `[${nowIso()}] [vehicleService.${fn}] DB_ERROR code=${err?.code ?? "UNKNOWN"} errno=${err?.errno ?? ""} msg=${err?.sqlMessage ?? err?.message ?? "NA"}`
  );
  if (meta) console.error(`[${nowIso()}] [vehicleService.${fn}] meta=`, meta);
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    console.error(err.stack);
  }
};

const mapMysqlError = (err: any, fallbackMessage: string): ServiceError => {
  switch (err?.code) {
    case "ER_DUP_ENTRY":
      return new ServiceError("Duplicate value violates a unique constraint.", 409, "ER_DUP_ENTRY");
    case "ER_NO_REFERENCED_ROW_2":
      return new ServiceError("Invalid reference: related record not found.", 422, "ER_NO_REFERENCED_ROW_2");
    case "ER_ROW_IS_REFERENCED_2":
      return new ServiceError("Cannot delete/update: record is referenced by other data.", 409, "ER_ROW_IS_REFERENCED_2");
    case "ER_BAD_FIELD_ERROR":
      return new ServiceError("Internal configuration error: unknown column.", 500, "ER_BAD_FIELD_ERROR");
    default:
      return new ServiceError(fallbackMessage, 500, err?.code ?? "UNKNOWN_DB_ERROR");
  }
};

/** Convert any error to our uniform failure response (and log). */
const fromError = (fn: string, err: any, fallbackMessage: string, meta?: Record<string, any>) => {
  logDbError(fn, err, meta);
  const se = err instanceof ServiceError ? err : mapMysqlError(err, fallbackMessage);
  return fail(se.code ?? "INTERNAL_ERROR", se.message);
};

// ---------- Types (match your table) ----------
export interface VehicleBasic {
  vehicle_id: number;
  capacity: number;
  license_plate: string;
  miles_driven: number;
  next_service: string | null; // DATE or DATETIME (nullable)
  warehouse_id: number;
  driver_id: number | null;
  created_at: string;
  updated_at: string | null;
  // Virtual flag if `is_active` exists (null if column not present)
  is_active?: number | null;
}


// ---------- Services ----------
export const getAllVehicles = async (): Promise<ServiceResponse<VehicleBasic[]>> => {
  const sql = `
    SELECT
      v.vehicle_id,
      v.capacity,
      v.license_plate,
      v.miles_driven,
      v.next_service,
      v.warehouse_id,
      w.warehouse_name,
      v.driver_id,
      d.name AS driver_name,
      v.created_at,
      v.updated_at,
      v.is_active
    FROM vehicle_details v
    LEFT JOIN driver_details d ON v.driver_id = d.id
    LEFT JOIN warehouse_details w ON v.warehouse_id = w.warehouse_id
    ORDER BY v.vehicle_id DESC
  `;

  try {
    const [rows] = await pool.query(sql);
    return ok(rows as VehicleBasic[]);
  } catch (err: any) {
    return fromError("getAllVehicles", err, "Failed to fetch vehicles.");
  }
};




export const getVehicleById = async (id: number): Promise<ServiceResponse<VehicleBasic>> => {
  const sql = `
    SELECT
      v.vehicle_id,
      v.capacity,
      v.license_plate,
      v.miles_driven,
      v.next_service,
      v.warehouse_id,
      v.driver_id,
      v.created_at,
      v.updated_at,
      v.is_active
    FROM vehicle_details v
    WHERE v.vehicle_id = ?
    LIMIT 1
  `;
  try {
    const [rows]: any = await pool.query(sql, [id]);
    const row = (rows[0] as VehicleBasic) ?? null;
    if (!row) {
      return fail("NOT_FOUND", "Vehicle not found.");
    }
    return ok(row);
  } catch (err: any) {
    return fromError("getVehicleById", err, "Failed to fetch vehicle.", { id });
  }
};

export const createVehicle = async (vehicle: {
  capacity: number;
  license_plate: string;
  warehouse_id: number;
  miles_driven?: number;         // default 0
  next_service?: string | null;  // nullable
  driver_id?: number | null;     // nullable
  is_active?: number;            // optional; used only if column exists
}): Promise<ServiceResponse<{ vehicle_id: number } & typeof vehicle>> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Plate uniqueness
    const [existingPlate]: any = await conn.query(
      `SELECT vehicle_id FROM vehicle_details WHERE license_plate = ?`,
      [vehicle.license_plate]
    );
    if (existingPlate.length > 0) {
      await conn.rollback();
      return fail("VEHICLE_EXISTS", "Vehicle with this license plate already exists.");
    }

    // 2) Driver availability (only if driver_id provided)
    //    If your rule is "a driver can be assigned to only ONE active vehicle",
    //    we check against vehicles with is_active = 1. Remove that predicate
    //    if you want to block assignment across ALL vehicles regardless of active flag.
    if (vehicle.driver_id !== undefined && vehicle.driver_id !== null) {
      const [driverBusy]: any = await conn.query(
        `SELECT vehicle_id, license_plate
           FROM vehicle_details
          WHERE driver_id = ?
            AND is_active = 1
          LIMIT 1`,
        [vehicle.driver_id]
      );
      if (driverBusy.length > 0) {
        await conn.rollback();
        return fail(
          "DRIVER_ASSIGNED",
          `Driver is already assigned to vehicle ${driverBusy[0].vehicle_id} (${driverBusy[0].license_plate}).`
        );
      }
    }

    // 3) Insert
    const cols = [
      "capacity",
      "license_plate",
      "miles_driven",
      "next_service",
      "warehouse_id",
      "driver_id",
      "is_active",
      "created_at",
      "updated_at",
    ];
    const placeholders = cols.map(() => "?").join(", ");
    const values = [
      vehicle.capacity,
      vehicle.license_plate,
      vehicle.miles_driven ?? 0,
      vehicle.next_service ?? null,
      vehicle.warehouse_id,
      vehicle.driver_id ?? null,
      vehicle.is_active ?? 1,
      new Date(),
      null,
    ];

    const [ins]: any = await conn.query(
      `INSERT INTO vehicle_details (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );

    await conn.commit();
    return ok({ vehicle_id: ins.insertId, ...vehicle }, "Vehicle created.");
  } catch (err: any) {
    await conn.rollback();
    return fromError("createVehicle", err, "Failed to create vehicle.", { license_plate: vehicle?.license_plate, driver_id: vehicle?.driver_id });
  } finally {
    conn.release();
  }
};


export const updateVehicle = async (
  id: number,
  vehicle: {
    capacity?: number;
    license_plate?: string;      // immutable (cannot change)
    warehouse_id?: number;
    miles_driven?: number;
    next_service?: string | null;
    driver_id?: number | null;
    is_active?: number;          // 1=active, 0=inactive
  }
): Promise<ServiceResponse<{ updated: boolean }>> => {
  console.log(" updateVehicle ", id, vehicle)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 0) Ensure vehicle exists and fetch current state (need driver_id for tour check)
    const [currentRows]: any = await conn.query(
      `SELECT vehicle_id, license_plate, driver_id, is_active
         FROM vehicle_details
        WHERE vehicle_id = ?
        LIMIT 1`,
      [id]
    );

    const current = currentRows?.[0];
    if (!current) {
      await conn.rollback();
      return fail("NOT_FOUND", "Vehicle not found.");
    }

    const driver_id=currentRows?.[0].driver_id;

    // 1) Plate immutability: disallow changing license_plate
    if (vehicle.license_plate !== undefined) {
      if (vehicle.license_plate !== current.license_plate) {
        await conn.rollback();
        return fail("PLATE_IMMUTABLE", "License plate cannot be changed.");
      }
      // ignore if same
    }

    // 2) Driver availability (only if setting a non-null driver)
    if (vehicle.driver_id !== undefined && vehicle.driver_id !== null) {
      const [driverBusy]: any = await conn.query(
        `SELECT vehicle_id, license_plate
           FROM vehicle_details
          WHERE driver_id = ?
            AND vehicle_id <> ?
            AND is_active = 1
          LIMIT 1`,
        [vehicle.driver_id, id]
      );
      if (driverBusy.length > 0) {
        await conn.rollback();
        return fail(
          "DRIVER_ASSIGNED",
          `Driver is already assigned to vehicle ${driverBusy[0].vehicle_id} (${driverBusy[0].license_plate}).`
        );
      }
    }
    console.log(" vehicle.is_active ", vehicle.is_active)
    
    // 2a) Block deactivation if the assigned driver has future tours
    if (vehicle.is_active !== undefined && Number(vehicle.is_active) === 0) {
      console.log(" vehicle.is_active ", vehicle.is_active)
      // Determine which driver_id to check (new one if provided, else current)
      const driverIdToCheck =
        vehicle.driver_id !== undefined ? vehicle.driver_id : current.driver_id;

      if (driverIdToCheck) {
        // Any tours strictly after today?
        const [futureTours]: any = await conn.query(
          `SELECT id, tour_name, tour_date
             FROM tourinfo_master
            WHERE driver_id = ?
              AND DATE(tour_date) > CURDATE()
            LIMIT 1`,
          [driver_id]
        );
        console.log(" futureTours ", futureTours)
        if (futureTours.length > 0) {
          await conn.rollback();
          return fail(
            "HAS_FUTURE_TOUR",
            "This vehicle’s driver has future tours assigned. You can’t disable the vehicle. Change the vehicle on those tours or delete the tours and try again."
          );
        }
      }
    }

    // 3) Build dynamic SET (skip license_plate entirely to keep it immutable)
    const sets: string[] = [];
    const vals: any[] = [];

    if (vehicle.capacity !== undefined)      { sets.push("capacity = ?");      vals.push(vehicle.capacity); }
    if (vehicle.miles_driven !== undefined)  { sets.push("miles_driven = ?");  vals.push(vehicle.miles_driven); }
    if (vehicle.next_service !== undefined)  { sets.push("next_service = ?");  vals.push(vehicle.next_service); }
    if (vehicle.warehouse_id !== undefined)  { sets.push("warehouse_id = ?");  vals.push(vehicle.warehouse_id); }
    if (vehicle.driver_id !== undefined)     { sets.push("driver_id = ?");     vals.push(vehicle.driver_id); }
    if (vehicle.is_active !== undefined)     { sets.push("is_active = ?");     vals.push(vehicle.is_active); }

    if (sets.length === 0) {
      await conn.rollback();
      return fail("NO_CHANGES", "No updatable fields were provided.");
    }

    console.log(" sets ", sets)
    console.log(" vals ", vals)

    sets.push("updated_at = ?");
    vals.push(new Date());

    const [result]: any = await conn.query(
      `UPDATE vehicle_details SET ${sets.join(", ")} WHERE vehicle_id = ?`,
      [...vals, id]
    );

    await conn.commit();

    if (result.affectedRows === 0) {
      return fail("NOT_FOUND", "Vehicle not found.");
    }

    return ok({ updated: true }, "Vehicle updated.");
  } catch (err: any) {
    await conn.rollback();
    return fromError("updateVehicle", err, "Failed to update vehicle.", {
      id,
      driver_id: vehicle?.driver_id,
      is_active: vehicle?.is_active,
    });
  } finally {
    conn.release();
  }
};

