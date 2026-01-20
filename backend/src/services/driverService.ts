import pool from "../config/database";
import bcrypt from "bcryptjs";
interface DriverBasic {
  id: number;
  name: string;
  mob: string;
  address: string;
  email: string;
  warehouse_id: number;
}

interface UnavailableDriver {
  driver: DriverBasic;
  reason: string;
}

interface AvailabilityResult {
  available: DriverBasic[];
  unavailable: UnavailableDriver[];
}

export const getAllDrivers = async () => {
  const [rows] = await pool.query(`
    SELECT 
      d.id,
      d.name,
      d.mob,
      d.address,
      d.email,
      d.warehouse_id,
      d.user_id,
      w.warehouse_name,
      u.is_active AS status
    FROM driver_details d
    JOIN users u ON d.user_id = u.user_id
    JOIN warehouse_details w ON d.warehouse_id = w.warehouse_id
  `);

  return rows;
};

export const getAvailableDrivers = async (
  tourDate: string,
  warehouseId: number,
): Promise<AvailabilityResult> => {
  console.log(
    `Fetching available drivers for date: ${tourDate}, warehouseId: ${warehouseId}`,
  );
  const [allDriversRows]: any = await pool.query(
    `
      SELECT d.id, d.name, d.mob, d.address, d.email, d.warehouse_id
      FROM driver_details d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.warehouse_id = ? AND u.is_active = 1
    `,
    [warehouseId],
  );
  const allDrivers: DriverBasic[] = allDriversRows;

  const available: DriverBasic[] = [];
  const unavailable: UnavailableDriver[] = [];

  // Compute start of the week for the given tour date
  const tourDay = new Date(tourDate);
  tourDay.setHours(0, 0, 0, 0);
  const dow = tourDay.getDay(); // 0=Sun … 6=Sat
  const diffToMon = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(tourDay);
  weekStart.setDate(tourDay.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);

  for (const drv of allDrivers) {
    // Same-day check
    const [sameDay]: any = await pool.query(
      `
        SELECT 1
        FROM tourInfo_master t
        WHERE t.driver_id = ? AND DATE(t.tour_date) = ?
        LIMIT 1
      `,
      [drv.id, tourDate],
    );
    if (sameDay.length > 0) {
      unavailable.push({
        driver: drv,
        reason: "Driver already has a trip scheduled on that date.",
      });
      continue;
    }

    // Weekly hours calculation
    const [tours]: any = await pool.query(
      `
        SELECT
          t.id AS tour_id,
          t.tour_date,
          t.start_time,
          t.end_time,
          TIMESTAMPDIFF(MINUTE,
            CONCAT(DATE(t.tour_date),' ',t.start_time),
            CONCAT(DATE(t.tour_date),' ',t.end_time)
          ) AS duration_minutes
        FROM tourInfo_master t
        WHERE t.driver_id = ?
          AND t.tour_date >= ?
          AND t.tour_date < DATE_ADD(?, INTERVAL 1 DAY)
        ORDER BY t.tour_date DESC, t.end_time DESC
      `,
      [drv.id, weekStart, tourDate],
    );

    let totalMinutes = 0;
    tours.forEach((row: any) => {
      if (row.duration_minutes != null) totalMinutes += row.duration_minutes;
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMin = totalMinutes % 60;

    if (totalHours >= 40) {
      unavailable.push({
        driver: drv,
        reason: `Worked ${totalHours}h ${remainingMin}m this week (≥ 40h).`,
      });
      continue;
    }

    available.push(drv);
  }

  return { available, unavailable };
};

export const getDriverByIdAsync = async (id: number) => {
  const [rows]: any = await pool.query(
    "SELECT * FROM driver_details WHERE id = ?",
    [id],
  );
  return rows[0];
};

export const createDriver = async (driver: {
  name: string;
  mob: string;
  address: string;
  email: string;
  status: number;
  password: string;
  warehouse_id: number;
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if email exists in users table
    const [existingUser]: any = await conn.query(
      `SELECT user_id FROM users WHERE email = ?`,
      [driver.email],
    );

    if (existingUser.length > 0) {
      await conn.rollback();
      return { error: true, message: "Email already exists" };
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(driver.password, 10);

    // 3. Insert into users table
    const [userResult]: any = await conn.query(
      `INSERT INTO users (username, email, password, role,is_active) VALUES (?, ?, ?, ?,?)`,
      [driver.name, driver.email, hashedPassword, "driver", driver.status],
    );

    const userId = userResult.insertId;

    // 4. Insert into driver_details table
    const [driverResult]: any = await conn.query(
      `INSERT INTO driver_details (name, mob, address, email, user_id, warehouse_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        driver.name,
        driver.mob,
        driver.address,
        driver.email,
        userId,
        driver.warehouse_id,
      ],
    );

    await conn.commit();

    return {
      id: driverResult.insertId,
      user_id: userId,
      ...driver,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
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
    status: number; // added status
    password?: string; // optional
  },
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if email already exists for another driver
    const [existing]: any = await conn.query(
      `SELECT id FROM driver_details WHERE email = ? AND id != ?`,
      [driver.email, id],
    );
    if (existing.length > 0) {
      await conn.rollback();
      return { error: true, message: "Email already exists" };
    }

    // 2. Update driver_details
    await conn.query(
      `UPDATE driver_details SET name = ?, mob = ?, address = ?, email = ?, warehouse_id = ? WHERE id = ?`,
      [
        driver.name,
        driver.mob,
        driver.address,
        driver.email,
        driver.warehouse_id,
        id,
      ],
    );

    // 3. Get associated user_id from driver_details
    const [driverRow]: any = await conn.query(
      `SELECT user_id FROM driver_details WHERE id = ?`,
      [id],
    );
    const userId = driverRow[0]?.user_id;

    if (userId) {
      if (driver.password && driver.password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(driver.password, 10);
        // 4. Update users table with password and status
        await conn.query(
          `UPDATE users SET username = ?, email = ?, password = ?, is_active = ? WHERE user_id = ?`,
          [driver.name, driver.email, hashedPassword, driver.status, userId],
        );
      } else {
        // 4. Update users table without password
        await conn.query(
          `UPDATE users SET username = ?, email = ?, is_active = ? WHERE user_id = ?`,
          [driver.name, driver.email, driver.status, userId],
        );
      }
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const disableDriver = async (
  id: number,
): Promise<{
  status: "success" | "warning" | "error";
  message: string;
  data?: any;
}> => {
  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: `Invalid driver ID: ${id}` };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check current state - Join with users table to get is_active status
    const [rows]: any = await connection.query(
      `SELECT d.id, d.name, d.user_id, u.is_active 
       FROM driver_details d 
       JOIN users u ON d.user_id = u.user_id 
       WHERE d.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return { status: "error", message: `Driver ID - ${id} not found` };
    }

    const driver = rows[0];
    if (driver.is_active === 0) {
      await connection.rollback();
      return {
        status: "warning",
        message: `Driver ID - ${id} (${driver.name}) is already inactive`,
      };
    }

    // Update if active - Update users table and driver_details updated_at
    const [result]: any = await connection.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [driver.user_id],
    );

    // Update the updated_at timestamp in driver_details
    await connection.query(
      "UPDATE driver_details SET updated_at = NOW() WHERE id = ?",
      [id],
    );

    await connection.commit();
    return {
      status: result.affectedRows > 0 ? "success" : "error",
      message:
        result.affectedRows > 0
          ? `Driver ID - ${id} (${driver.name}) disabled successfully`
          : `Failed to disable driver ${id}`,
      data: {
        driverId: id,
        driverName: driver.name,
        userId: driver.user_id,
        status: "disabled",
      },
    };
  } catch (err) {
    if (connection) await connection.rollback();
    return {
      status: "error",
      message: `Failed to disable driver ${id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  } finally {
    if (connection) connection.release();
  }
};

// Disable multiple drivers
export const disableMultipleDrivers = async (
  ids: number[],
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

  // Validate individual IDs
  const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
  if (invalidIds.length > 0) {
    return {
      status: "error",
      message: `Invalid driver IDs: ${invalidIds.join(", ")}`,
    };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check current states - Join with users table to get is_active status
    const [rows]: any = await connection.query(
      `SELECT d.id, d.name, d.user_id, u.is_active 
       FROM driver_details d 
       JOIN users u ON d.user_id = u.user_id 
       WHERE d.id IN (?)`,
      [ids],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return {
        status: "error",
        message: "No drivers found with the provided IDs",
      };
    }

    const activeDrivers = rows.filter((r: any) => r.is_active === 1);
    const inactiveCount = rows.filter((r: any) => r.is_active === 0).length;
    const activeUserIds = activeDrivers.map((r: any) => r.user_id);

    if (activeDrivers.length === 0) {
      await connection.rollback();
      return {
        status: "warning",
        message: "All provided drivers are already inactive",
        data: { requestedIds: ids, alreadyInactive: inactiveCount },
      };
    }

    // Disable active drivers by updating users table
    const [result]: any = await connection.query(
      `UPDATE users SET is_active = 0 WHERE user_id IN (?)`,
      [activeUserIds],
    );

    // Update driver_details timestamp for the active drivers
    const activeDriverIds = activeDrivers.map((r: any) => r.id);
    await connection.query(
      `UPDATE driver_details SET updated_at = NOW() WHERE id IN (?)`,
      [activeDriverIds],
    );

    await connection.commit();
    return {
      status: "success",
      message: `${result.affectedRows} of ${ids.length} drivers disabled (Already inactive: ${inactiveCount})`,
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
      message: `Failed to disable drivers: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  } finally {
    if (connection) connection.release();
  }
};

export const evaluateDriverEligibility = async (driverId: number) => {
  console.log(
    `[Service] Evaluating driver eligibility for driver ID: ${driverId}`,
  );

  // Step 1: Calculate start of the current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  console.log(
    `[Step 1] Start of current week (Monday): ${monday.toLocaleString()}`,
  );

  // Step 2: Fetch tours for this driver from this week's Monday to now
  const [rows]: any = await pool.query(
    `
    SELECT 
      t.id AS tour_id,
      t.tour_date,
      t.start_time,
      t.end_time,
      TIMESTAMPDIFF(MINUTE, t.start_time, t.end_time) AS duration_minutes
    FROM tourinfo_master t
    WHERE t.driver_id = ?
      AND t.tour_date >= ?
    ORDER BY t.tour_date DESC, t.end_time DESC
    `,
    [driverId, monday],
  );
  console.log(`[Step 2] Fetched ${rows.length} tours for this week.`);

  // Step 3: Handle no tours this week
  if (rows.length === 0) {
    console.log(`[Step 3] No tours this week. Driver is eligible.`);
    return {
      driver_id: driverId,
      totalWorkedHours: 0,
      lastTourEndTime: null,
      eligible: true,
      message: "Driver has no tours this week. Eligible for assignment.",
    };
  }

  // Step 4: Calculate total worked minutes from all tours
  let totalMinutes = 0;
  for (const row of rows) {
    if (row.duration_minutes !== null && !isNaN(row.duration_minutes)) {
      console.log(row.duration_minutes);
      totalMinutes += row.duration_minutes;
      console.log(
        `[Step 4] Tour ID ${row.tour_id}: added ${row.duration_minutes} minutes`,
      );
    } else {
      console.warn(`[Step 4] Tour ID ${row.tour_id} has invalid duration.`);
    }
  }
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  console.log(
    `[Step 4] Total worked time this week: ${totalHours}h ${remainingMinutes}m`,
  );

  // Step 5: Get last tour end time (safely parse DATETIME + TIME)
  const lastTour = rows[0];
  const lastTourEndTime = new Date(lastTour.tour_date);
  const [endHour, endMinute] = lastTour.end_time.split(":").map(Number);
  lastTourEndTime.setHours(endHour);
  lastTourEndTime.setMinutes(endMinute);
  lastTourEndTime.setSeconds(0);
  lastTourEndTime.setMilliseconds(0);
  console.log(`[Step 5] Last tour ended at: ${lastTourEndTime.toISOString()}`);

  // Step 6: Calculate rest time since last tour
  const nowTime = new Date();
  const restMs = nowTime.getTime() - lastTourEndTime.getTime();
  const restHours = Math.floor(restMs / (1000 * 60 * 60));
  const restMinutes = Math.floor((restMs / (1000 * 60)) % 60);
  console.log(`[Step 6] Time since last tour: ${restHours}h ${restMinutes}m`);

  // Step 7: Determine eligibility based on 40-hour rule
  const eligible = totalHours < 40;
  console.log(`[Step 7] Driver eligible: ${eligible}`);

  // Step 8: Return result
  return {
    driver_id: driverId,
    totalWorkedHours: { hours: totalHours, minutes: remainingMinutes },
    lastTourEndTime: lastTourEndTime.toISOString(),
    restSinceLastTour: { hours: restHours, minutes: restMinutes },
    eligible,
    message: eligible
      ? "Driver is eligible: has not worked 40 hours this week."
      : "Driver is not eligible: worked 40 or more hours this week.",
  };
};

/* 1.  Weightage table  (edit here if priorities change) */
const KPI_WEIGHT = {
  imageUpload: 1, // KPI-1  Start/End photos
  deliveryAccuracy: 10, // KPI-2  Deliveries Count
  pod: 1, // KPI-3  Proof of Deliveries
  kmEfficiency: 3, // KPI-4  KM Efficiency
  timeManagement: 7, // KPI-5  Time Management
  fuelEfficiency: 3, // KPI-6  Fuel Efficiency
  customerRating: 4, // KPI-7  Customer Rating
} as const;

const MAX_KPI_SCORE = 5; // every KPI is scored 0-5
const TOTAL_WEIGHT = Object.values(KPI_WEIGHT).reduce((a, b) => a + b, 0);
const MAX_WEIGHT_SUM = TOTAL_WEIGHT * MAX_KPI_SCORE;

/* 2.  Main function */
export const getDriverPerformanceData = async (
  startDate: string,
  endDate: string,
  driver_id: number | undefined,
) => {
  console.log(
    "------------------------------------------------------------------------------------------------------------",
  );
  console.log(
    `Fetching performance data from ${startDate} to ${endDate} for driver_id: ${driver_id}`,
  );

  const driverParam = driver_id ?? null;

  /* ---------- SQL ----------------- */
  const [rows] = await pool.query(
    `
    SELECT 
      d.id,
      d.name,
      d.mob              AS mobile,
      d.email,
      d.warehouse_id,
      w.warehouse_name   AS warehouse_name,
      d.overall_rating   AS db_rating,

      COUNT(t.id) AS total,
      SUM(CASE WHEN t.tour_status = 'completed' THEN 1 ELSE 0 END) AS completed,

      /* KPI-1  image uploads -------------------------------------------- */
      SUM(
        CASE WHEN t.tour_status = 'completed' THEN
          (CASE WHEN t.secure_loading_photo       IS NOT NULL AND OCTET_LENGTH(t.secure_loading_photo)       > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.truck_loaded_photo         IS NOT NULL AND OCTET_LENGTH(t.truck_loaded_photo)         > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.start_fuel_gauge_photo     IS NOT NULL AND OCTET_LENGTH(t.start_fuel_gauge_photo)     > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.start_odometer_photo       IS NOT NULL AND OCTET_LENGTH(t.start_odometer_photo)       > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.start_truck_exterior_photo IS NOT NULL AND OCTET_LENGTH(t.start_truck_exterior_photo) > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.end_fuel_receipt_photo     IS NOT NULL AND OCTET_LENGTH(t.end_fuel_receipt_photo)     > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.end_fuel_gauge_photo       IS NOT NULL AND OCTET_LENGTH(t.end_fuel_gauge_photo)       > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.end_odometer_photo         IS NOT NULL AND OCTET_LENGTH(t.end_odometer_photo)         > 0 THEN 1 ELSE 0 END) +
          (CASE WHEN t.undelivered_modules_photo  IS NOT NULL AND OCTET_LENGTH(t.undelivered_modules_photo)  > 0 THEN 1 ELSE 0 END)
        ELSE 0 END
      ) AS totalImagesUploaded,

      /* KPI-2  delivery accuracy ---------------------------------------- */
      SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_expected ELSE 0 END) AS totalExpectedDeliveries,
      SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_actual   ELSE 0 END) AS totalActualDeliveries,

      /* KPI-3  valid PODs ------------------------------------------------ */
      SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_valid_pod ELSE 0 END) AS totalValidPODs,

      /* KPI-4  KM efficiency -------------------------------------------- */
      SUM(CASE WHEN t.tour_status = 'completed' THEN t.excepted_tour_total_km ELSE 0 END) AS totalPlannedKM,
      SUM(CASE WHEN t.tour_status = 'completed' THEN 
        (CASE 
          WHEN t.tour_start_km IS NOT NULL AND t.tour_end_km IS NOT NULL 
          THEN t.tour_end_km - t.tour_start_km
          ELSE 0 
        END)
      ELSE 0 END) AS totalActualKM,

      /* KPI-5  time management ------------------------------------------ */
      SUM(CASE WHEN t.tour_status = 'completed' 
               AND t.tour_total_estimate_time IS NOT NULL 
               THEN TIME_TO_SEC(t.tour_total_estimate_time) ELSE 0 END) AS totalPlannedSeconds,
      SUM(CASE WHEN t.tour_status = 'completed' 
               AND t.start_time IS NOT NULL AND t.end_time IS NOT NULL 
               THEN TIME_TO_SEC(TIMEDIFF(t.end_time, t.start_time)) ELSE 0 END) AS totalActualSeconds,

      /* KPI-7  customer rating ------------------------------------------ */
      SUM(CASE WHEN t.tour_status = 'completed' AND t.overall_performance_rating IS NOT NULL 
               THEN t.overall_performance_rating ELSE 0 END) AS totalCustomerRating

    FROM driver_details d
    LEFT JOIN tourinfo_master t 
           ON d.id = t.driver_id AND t.tour_date BETWEEN ? AND ?
    LEFT JOIN warehouse_details w 
           ON d.warehouse_id = w.warehouse_id
    LEFT JOIN (
      SELECT tour_id,
             GREATEST(COUNT(*) -1, 0)                                 AS total_expected,
             SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)     AS total_actual,
             SUM(
               CASE 
                 WHEN recipient_type = 'customer' 
                   AND customer_signature      IS NOT NULL AND OCTET_LENGTH(customer_signature)      > 0
                   AND delivered_item_pic      IS NOT NULL AND OCTET_LENGTH(delivered_item_pic)      > 0
                 THEN 1
                 WHEN recipient_type = 'neighbour' 
                   AND neighbour_signature     IS NOT NULL AND OCTET_LENGTH(neighbour_signature)     > 0
                   AND delivered_pic_neighbour IS NOT NULL AND OCTET_LENGTH(delivered_pic_neighbour) > 0
                 THEN 1
                 ELSE 0
               END
             ) AS total_valid_pod
      FROM route_segments 
      GROUP BY tour_id
    ) rs ON rs.tour_id = t.id

    /* Optional driver filter */
    WHERE (? IS NULL OR d.id = ?)

    GROUP BY d.id
    ORDER BY d.id;
    `,
    [startDate, endDate, driverParam, driverParam],
  );

  console.log(
    "------------------------------------------------------------------------------------------------------------",
  );

  /* ---------- mapping & KPI calculations ------------------------------ */
  return (rows as any[]).map((row) => {
    /* raw counts ------------------------------------------------------- */
    const completedTours = Number(row.completed) || 0;
    const totalImagesUploaded = Number(row.totalImagesUploaded) || 0;
    const expectedDeliveries = Number(row.totalExpectedDeliveries) || 0;
    const actualDeliveries = Number(row.totalActualDeliveries) || 0;
    const validPODs = Number(row.totalValidPODs) || 0;
    const plannedKM = Number(row.totalPlannedKM) || 0;
    const actualKM = Number(row.totalActualKM) || 0;
    const undeliveredCount = expectedDeliveries - actualDeliveries;

    const plannedSeconds = Number(row.totalPlannedSeconds) || 0;
    const actualSeconds = Number(row.totalActualSeconds) || 0;
    const totalCustomerRating = Number(row.totalCustomerRating) || 0;

    /* KPI-1  Image upload score (0-5) ---------------------------------- */
    const maxPossibleImages = completedTours * 9;
    const kpi1ImageUploadScore =
      maxPossibleImages > 0
        ? parseFloat(((totalImagesUploaded / maxPossibleImages) * 5).toFixed(2))
        : 0;

    /* KPI-2  Delivery accuracy (0-5) ----------------------------------- */
    const kpi2DeliveryScore =
      expectedDeliveries > 0
        ? parseFloat(((actualDeliveries / expectedDeliveries) * 5).toFixed(2))
        : 0;

    /* KPI-3  POD score (0-5) ------------------------------------------- */
    const kpi3PODScore =
      expectedDeliveries > 0
        ? parseFloat(((validPODs / expectedDeliveries) * 5).toFixed(2))
        : 0;

    /* KPI-4  KM efficiency (0-5) --------------------------------------- */
    let kpi4KmEfficiencyScore = 0;
    if (plannedKM > 0) {
      const ratio = actualKM / plannedKM;
      if (ratio <= 1.0) kpi4KmEfficiencyScore = 5;
      else if (ratio <= 1.01) kpi4KmEfficiencyScore = 4.5;
      else if (ratio <= 1.02) kpi4KmEfficiencyScore = 4;
      else if (ratio <= 1.03) kpi4KmEfficiencyScore = 3.5;
      else if (ratio <= 1.04) kpi4KmEfficiencyScore = 3;
      else if (ratio <= 1.05) kpi4KmEfficiencyScore = 2.5;
      else if (ratio <= 1.06) kpi4KmEfficiencyScore = 2;
      else if (ratio <= 1.07) kpi4KmEfficiencyScore = 1.5;
      else if (ratio <= 1.08) kpi4KmEfficiencyScore = 1;
      else kpi4KmEfficiencyScore = 0.5;
    }

    /* KPI-5  Time management (0-5) ------------------------------------- */
    let kpi5TimeScore = 0;
    if (plannedSeconds > 0 && actualSeconds > 0) {
      const ratio = actualSeconds / plannedSeconds;
      if (ratio <= 1.0) kpi5TimeScore = 5;
      else if (ratio <= 1.01) kpi5TimeScore = 4.5;
      else if (ratio <= 1.02) kpi5TimeScore = 4;
      else if (ratio <= 1.03) kpi5TimeScore = 3.5;
      else if (ratio <= 1.04) kpi5TimeScore = 3;
      else if (ratio <= 1.05) kpi5TimeScore = 2.5;
      else if (ratio <= 1.06) kpi5TimeScore = 2;
      else if (ratio <= 1.07) kpi5TimeScore = 1.5;
      else if (ratio <= 1.08) kpi5TimeScore = 1;
      else kpi5TimeScore = 0.5;
    }

    /* KPI-6  Fuel efficiency (0-5) ------------------------------------- */
    let kpi6FuelEfficiencyScore = 0;
    let expectedFuel = 0;
    let actualFuel = 0;
    if (plannedKM > 0 && actualKM > 0) {
      expectedFuel = plannedKM / 10; // your business rule
      actualFuel = actualKM / 10;
      const fuelRatio = actualFuel / expectedFuel;

      if (fuelRatio <= 1.0) kpi6FuelEfficiencyScore = 5;
      else if (fuelRatio <= 1.01) kpi6FuelEfficiencyScore = 4.5;
      else if (fuelRatio <= 1.02) kpi6FuelEfficiencyScore = 4;
      else if (fuelRatio <= 1.03) kpi6FuelEfficiencyScore = 3.5;
      else if (fuelRatio <= 1.04) kpi6FuelEfficiencyScore = 3;
      else if (fuelRatio <= 1.05) kpi6FuelEfficiencyScore = 2.5;
      else if (fuelRatio <= 1.06) kpi6FuelEfficiencyScore = 2;
      else if (fuelRatio <= 1.07) kpi6FuelEfficiencyScore = 1.5;
      else if (fuelRatio <= 1.08) kpi6FuelEfficiencyScore = 1;
      else kpi6FuelEfficiencyScore = 0.5;
    }

    /* KPI-7  Customer rating (0-5) ------------------------------------- */
    const kpi7CustomerRating =
      completedTours > 0
        ? parseFloat((totalCustomerRating / completedTours).toFixed(2))
        : 0;

    /* ---------- WEIGHTED OVERALL RATING ------------------------------- */
    const actualWeightSum =
      KPI_WEIGHT.imageUpload * kpi1ImageUploadScore +
      KPI_WEIGHT.deliveryAccuracy * kpi2DeliveryScore +
      KPI_WEIGHT.pod * kpi3PODScore +
      KPI_WEIGHT.kmEfficiency * kpi4KmEfficiencyScore +
      KPI_WEIGHT.timeManagement * kpi5TimeScore +
      KPI_WEIGHT.fuelEfficiency * kpi6FuelEfficiencyScore +
      KPI_WEIGHT.customerRating * kpi7CustomerRating;

    const overallPerformanceRating =
      MAX_WEIGHT_SUM > 0
        ? parseFloat(((actualWeightSum / MAX_WEIGHT_SUM) * 5).toFixed(2))
        : 0;

    /* ---------- final object ------------------------------------------ */
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name || "Unknown",

      /* KPI raw numbers you may need in UI ----------------------------- */
      completedTours,

      kpi1ImageUploadScore,
      kpi1ImageCount: totalImagesUploaded,

      kpi2DeliveryScore,
      totalExpectedDeliveries: expectedDeliveries,
      totalActualDeliveries: actualDeliveries,
      undeliveredCount,

      kpi3PODScore,
      validPODs,

      kpi4KmEfficiencyScore,
      plannedKM,
      actualKM,

      kpi5TimeScore,
      totalPlannedTimeMinutes: Math.round(plannedSeconds / 60),
      totalActualTimeMinutes: Math.round(actualSeconds / 60),

      kpi6FuelEfficiencyScore,
      expectedFuelLiters: parseFloat(expectedFuel.toFixed(2)),
      actualFuelLiters: parseFloat(actualFuel.toFixed(2)),

      kpi7CustomerRating,

      /* NEW weighted rating (0-5) ------------------------------------- */
      rating: overallPerformanceRating,

      /* optional: keep old DB value for auditing ----------------------- */
      rawDbRating: Number(row.db_rating) || 0,
    };
  });
};

// NEW: returns per-day KPIs for the given driver in one call (Sun→Sat)
export const getDriverPerformanceWeekDaily = async (
  startDate: string, // YYYY-MM-DD (Sunday)
  endDate: string, // YYYY-MM-DD (Saturday)
  driverId: number | undefined,
) => {
  if (!driverId) return [];

  // --- SQL: build 7 dates (Sun→Sat), aggregate tours by DATE, left-join so missing days become zeros
  const sql = `
    WITH RECURSIVE dates AS (
      SELECT DATE(?) AS d
      UNION ALL
      SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM dates WHERE d < DATE(?)
    ),
    per_day AS (
      SELECT
        DATE(t.tour_date)                                                 AS day,
        /* counts & sums per completed tour */
        SUM(CASE WHEN t.tour_status = 'completed' THEN 1 ELSE 0 END)     AS completedTours,

        /* KPI-1 (kept here only for completeness; not used in final 4 bars) */
        SUM(
          CASE WHEN t.tour_status = 'completed' THEN
            (CASE WHEN t.secure_loading_photo       IS NOT NULL AND OCTET_LENGTH(t.secure_loading_photo)       > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.truck_loaded_photo         IS NOT NULL AND OCTET_LENGTH(t.truck_loaded_photo)         > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.start_fuel_gauge_photo     IS NOT NULL AND OCTET_LENGTH(t.start_fuel_gauge_photo)     > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.start_odometer_photo       IS NOT NULL AND OCTET_LENGTH(t.start_odometer_photo)       > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.start_truck_exterior_photo IS NOT NULL AND OCTET_LENGTH(t.start_truck_exterior_photo) > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.end_fuel_receipt_photo     IS NOT NULL AND OCTET_LENGTH(t.end_fuel_receipt_photo)     > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.end_fuel_gauge_photo       IS NOT NULL AND OCTET_LENGTH(t.end_fuel_gauge_photo)       > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.end_odometer_photo         IS NOT NULL AND OCTET_LENGTH(t.end_odometer_photo)         > 0 THEN 1 ELSE 0 END) +
            (CASE WHEN t.undelivered_modules_photo  IS NOT NULL AND OCTET_LENGTH(t.undelivered_modules_photo)  > 0 THEN 1 ELSE 0 END)
          ELSE 0 END
        )                                                                 AS totalImagesUploaded,

        /* KPI-2/3 base numbers (deliveries & valid PODs) */
        SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_expected ELSE 0 END) AS totalExpectedDeliveries,
        SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_actual   ELSE 0 END) AS totalActualDeliveries,
        SUM(CASE WHEN t.tour_status = 'completed' THEN rs.total_valid_pod ELSE 0 END) AS totalValidPODs,

        /* KPI-4 base (KM) */
        SUM(CASE WHEN t.tour_status = 'completed' THEN t.excepted_tour_total_km ELSE 0 END) AS totalPlannedKM,
        SUM(
          CASE WHEN t.tour_status = 'completed' THEN
            (CASE WHEN t.tour_start_km IS NOT NULL AND t.tour_end_km IS NOT NULL
                  THEN t.tour_end_km - t.tour_start_km ELSE 0 END)
          ELSE 0 END
        )                                                                 AS totalActualKM,

        /* KPI-5 base (Time) */
        SUM(CASE WHEN t.tour_status = 'completed' AND t.tour_total_estimate_time IS NOT NULL
                 THEN TIME_TO_SEC(t.tour_total_estimate_time) ELSE 0 END) AS totalPlannedSeconds,
        SUM(CASE WHEN t.tour_status = 'completed' AND t.start_time IS NOT NULL AND t.end_time IS NOT NULL
                 THEN TIME_TO_SEC(TIMEDIFF(t.end_time, t.start_time)) ELSE 0 END) AS totalActualSeconds,

        /* KPI-7 base (Customer rating) */
        SUM(CASE WHEN t.tour_status = 'completed' AND t.overall_performance_rating IS NOT NULL
                 THEN t.overall_performance_rating ELSE 0 END)             AS totalCustomerRating
      FROM tourinfo_master t
      LEFT JOIN (
        SELECT
          tour_id,
          GREATEST(COUNT(*) - 1, 0) AS total_expected,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS total_actual,
          SUM(
            CASE
              WHEN recipient_type = 'customer'
                AND customer_signature      IS NOT NULL AND OCTET_LENGTH(customer_signature)      > 0
                AND delivered_item_pic      IS NOT NULL AND OCTET_LENGTH(delivered_item_pic)      > 0
              THEN 1
              WHEN recipient_type = 'neighbour'
                AND neighbour_signature     IS NOT NULL AND OCTET_LENGTH(neighbour_signature)     > 0
                AND delivered_pic_neighbour IS NOT NULL AND OCTET_LENGTH(delivered_pic_neighbour) > 0
              THEN 1
              ELSE 0
            END
          ) AS total_valid_pod
        FROM route_segments WHERE status = 'delivered'
        GROUP BY tour_id
      ) rs ON rs.tour_id = t.id
      WHERE t.driver_id = ?
        AND DATE(t.tour_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(t.tour_date)
    )
    SELECT
      DATE_FORMAT(dates.d, '%Y-%m-%d')                                  AS date,
      COALESCE(pd.completedTours, 0)                                    AS completedTours,
      COALESCE(pd.totalExpectedDeliveries, 0)                           AS totalExpectedDeliveries,
      COALESCE(pd.totalActualDeliveries, 0)                             AS totalActualDeliveries,
      COALESCE(pd.totalValidPODs, 0)                                    AS totalValidPODs,
      COALESCE(pd.totalPlannedKM, 0)                                    AS totalPlannedKM,
      COALESCE(pd.totalActualKM, 0)                                     AS totalActualKM,
      COALESCE(pd.totalPlannedSeconds, 0)                               AS totalPlannedSeconds,
      COALESCE(pd.totalActualSeconds, 0)                                AS totalActualSeconds,
      COALESCE(pd.totalCustomerRating, 0)                               AS totalCustomerRating
    FROM dates
    LEFT JOIN per_day pd ON pd.day = dates.d
    ORDER BY dates.d;
  `;

  const [dailyRows] = await pool.query(sql, [
    startDate,
    endDate,
    driverId,
    startDate,
    endDate,
  ]);

  // --- Map each day to the 4 KPIs you want (0–5)
  const results = (dailyRows as any[]).map((r) => {
    const completedTours = Number(r.completedTours) || 0;

    const expectedDeliveries = Number(r.totalExpectedDeliveries) || 0;
    const actualDeliveries = Number(r.totalActualDeliveries) || 0;
    const validPODs = Number(r.totalValidPODs) || 0;

    const plannedKM = Number(r.totalPlannedKM) || 0;
    const actualKM = Number(r.totalActualKM) || 0;

    const plannedSeconds = Number(r.totalPlannedSeconds) || 0;
    const actualSeconds = Number(r.totalActualSeconds) || 0;

    const totalCustomerRating = Number(r.totalCustomerRating) || 0;

    // KPI-3 POD (0-5)
    const kpi3PODScore =
      expectedDeliveries > 0
        ? parseFloat(((validPODs / expectedDeliveries) * 5).toFixed(2))
        : 0;

    // KPI-6 Fuel Efficiency (0-5) — same thresholds as your aggregate
    let kpi6FuelEfficiencyScore = 0;
    if (plannedKM > 0 && actualKM > 0) {
      const expectedFuel = plannedKM / 10; // your rule
      const actualFuel = actualKM / 10;
      const fuelRatio = actualFuel / expectedFuel;

      if (fuelRatio <= 1.0) kpi6FuelEfficiencyScore = 5;
      else if (fuelRatio <= 1.01) kpi6FuelEfficiencyScore = 4.5;
      else if (fuelRatio <= 1.02) kpi6FuelEfficiencyScore = 4;
      else if (fuelRatio <= 1.03) kpi6FuelEfficiencyScore = 3.5;
      else if (fuelRatio <= 1.04) kpi6FuelEfficiencyScore = 3;
      else if (fuelRatio <= 1.05) kpi6FuelEfficiencyScore = 2.5;
      else if (fuelRatio <= 1.06) kpi6FuelEfficiencyScore = 2;
      else if (fuelRatio <= 1.07) kpi6FuelEfficiencyScore = 1.5;
      else if (fuelRatio <= 1.08) kpi6FuelEfficiencyScore = 1;
      else kpi6FuelEfficiencyScore = 0.5;
    }

    // KPI-5 Time Management (0-5)
    let kpi5TimeScore = 0;
    if (plannedSeconds > 0 && actualSeconds > 0) {
      const ratio = actualSeconds / plannedSeconds;
      if (ratio <= 1.0) kpi5TimeScore = 5;
      else if (ratio <= 1.01) kpi5TimeScore = 4.5;
      else if (ratio <= 1.02) kpi5TimeScore = 4;
      else if (ratio <= 1.03) kpi5TimeScore = 3.5;
      else if (ratio <= 1.04) kpi5TimeScore = 3;
      else if (ratio <= 1.05) kpi5TimeScore = 2.5;
      else if (ratio <= 1.06) kpi5TimeScore = 2;
      else if (ratio <= 1.07) kpi5TimeScore = 1.5;
      else if (ratio <= 1.08) kpi5TimeScore = 1;
      else kpi5TimeScore = 0.5;
    }

    // KPI-7 Customer Rating (0-5) — average of tour ratings for the day
    const kpi7CustomerRating =
      completedTours > 0
        ? parseFloat((totalCustomerRating / completedTours).toFixed(2))
        : 0;

    return {
      date: r.date, // "YYYY-MM-DD"
      kpi3PODScore, // Proof of Delivery
      kpi6FuelEfficiencyScore, // Fuel Efficiency
      kpi5TimeScore, // Time Management
      kpi7CustomerRating, // Customer Rating

      // (optional raw values if the UI needs tooltips)
      _raw: {
        completedTours,
        expectedDeliveries,
        actualDeliveries,
        validPODs,
        plannedKM,
        actualKM,
        plannedSeconds,
        actualSeconds,
        totalCustomerRating,
      },
    };
  });

  return results; // always 7 items (Sun→Sat), zeros where no data
};
