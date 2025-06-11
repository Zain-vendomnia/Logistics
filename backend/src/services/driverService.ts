import pool from "../database";
import bcrypt from "bcryptjs";

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
      u.is_active AS status
    FROM driver_details d
    JOIN users u ON d.user_id = u.user_id
  `);

  return rows;
};


export const getDriverById = async (id: number) => {
  const [rows]: any = await pool.query("SELECT * FROM driver_details WHERE id = ?", [id]);
  return rows[0];
};

export const createDriver = async (driver: {
  name: string;
  mob: string;
  address: string;
  email: string;
  status:number;
  password: string;
  warehouse_id: number;
}) => {
  const conn = await pool.getConnection();
  try {
    
    await conn.beginTransaction();

    // 1. Check if email exists in users table
    const [existingUser]: any = await conn.query(
      `SELECT user_id FROM users WHERE email = ?`,
      [driver.email]
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
      [driver.name, driver.email, hashedPassword, "driver",driver.status]
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
      ]
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
  }
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if email already exists for another driver
    const [existing]: any = await conn.query(
      `SELECT id FROM driver_details WHERE email = ? AND id != ?`,
      [driver.email, id]
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
      ]
    );

    // 3. Get associated user_id from driver_details
    const [driverRow]: any = await conn.query(
      `SELECT user_id FROM driver_details WHERE id = ?`,
      [id]
    );
    const userId = driverRow[0]?.user_id;

    if (userId) {
      if (driver.password && driver.password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(driver.password, 10);
        // 4. Update users table with password and status
        await conn.query(
          `UPDATE users SET username = ?, email = ?, password = ?, is_active = ? WHERE user_id = ?`,
          [driver.name, driver.email, hashedPassword, driver.status, userId]
        );
      } else {
        // 4. Update users table without password
        await conn.query(
          `UPDATE users SET username = ?, email = ?, is_active = ? WHERE user_id = ?`,
          [driver.name, driver.email, driver.status, userId]
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

export const deleteDriver = async (id: number) => {
  const conn = await pool.getConnection();
  try {
    console.log("---------------------------------------------------------------------");
    console.log(`🔄 Starting transaction to deactivate driver ID: ${id}`);
    await conn.beginTransaction();

    // 1. Get user_id from driver_details
    const [driverRows]: any = await conn.query(
      "SELECT user_id FROM driver_details WHERE id = ?",
      [id]
    );

    if (driverRows.length === 0) {
      console.log(`❌ No driver found with ID: ${id}`);
      await conn.rollback();
      return false;
    }

    const userId = driverRows[0].user_id;
    console.log(`✅ Retrieved user_id: ${userId} for driver_id: ${id}`);

    // 2. Get tour IDs from tourinfo_master for current/future dates
    const [tourRows]: any = await conn.query(
      "SELECT id FROM tourinfo_master WHERE driver_id = ? AND tour_date >= CURRENT_DATE()",
      [id]
    );

    const tourIds = tourRows.map((row: any) => row.id);
    console.log(`📦 Found ${tourIds.length} future/current tour(s) for driver_id ${id}:`, tourIds);

    // 3. Delete related data using tour IDs (if any)
    if (tourIds.length > 0) {
      // Delete from route_segments
      const [routeDelete]: any = await conn.query(
        "DELETE FROM route_segments WHERE tour_id IN (?)",
        [tourIds]
      );
      console.log(`🗑️ Deleted ${routeDelete.affectedRows} route segment(s)`);

      // Delete from tour_driver
      const [tourDriverDelete]: any = await conn.query(
        "DELETE FROM tour_driver WHERE tour_id IN (?)",
        [tourIds]
      );
      console.log(`🗑️ Deleted ${tourDriverDelete.affectedRows} row(s) from tour_driver`);

      // Delete from tourinfo_master
      const [tourInfoDelete]: any = await conn.query(
        "DELETE FROM tourinfo_master WHERE id IN (?)",
        [tourIds]
      );
      console.log(`🗑️ Deleted ${tourInfoDelete.affectedRows} row(s) from tourinfo_master`);
    } else {
      console.log(`ℹ️ No future tours found to delete for the driver.`);
    }

    // 4. Set user as inactive
    const [userUpdate]: any = await conn.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [userId]
    );
    console.log(`⚠️ Set is_active = 0 for user_id: ${userId}`);

    await conn.commit();
    console.log(`✅ Transaction committed successfully. Driver ID ${id} deactivated.`);
    return userUpdate.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Error occurred. Transaction rolled back.`, err);
    throw err;
  } finally {
    conn.release();
    console.log(`🔚 Connection released for driver_id: ${id}`);
    console.log("---------------------------------------------------------------------");
  }
};


export const deleteMultipleDrivers = async (ids: number[]) => {
  const conn = await pool.getConnection();
  try {
    console.log("---------------------------------------------------------------------");
    console.log(`🔄 Starting transaction to deactivate multiple drivers: [${ids.join(", ")}]`);
    await conn.beginTransaction();

    if (ids.length === 0) {
      console.log("⚠️ No driver IDs provided.");
      await conn.rollback();
      return 0;
    }

    // 1. Get user_ids for each driver
    const [driverRows]: any = await conn.query(
      `SELECT id, user_id FROM driver_details WHERE id IN (?)`,
      [ids]
    );

    if (driverRows.length === 0) {
      console.log("❌ No matching driver records found.");
      await conn.rollback();
      return 0;
    }

    const userIds = driverRows.map((row: any) => row.user_id);
    const validDriverIds = driverRows.map((row: any) => row.id);

    console.log(`✅ Retrieved user_ids for driver_ids: [${validDriverIds.join(", ")}]`);

    // 2. Get tour IDs for all drivers for current/future tours
    const [tourRows]: any = await conn.query(
      `SELECT id FROM tourinfo_master WHERE driver_id IN (?) AND tour_date >= CURRENT_DATE()`,
      [validDriverIds]
    );
    const tourIds = tourRows.map((row: any) => row.id);
    console.log(`📦 Found ${tourIds.length} future/current tour(s) across drivers:`, tourIds);

    // 3. Delete tour-related data if applicable
    if (tourIds.length > 0) {
      const [routeDelete]: any = await conn.query(
        `DELETE FROM route_segments WHERE tour_id IN (?)`,
        [tourIds]
      );
      console.log(`🗑️ Deleted ${routeDelete.affectedRows} route segment(s)`);

      const [tourDriverDelete]: any = await conn.query(
        `DELETE FROM tour_driver WHERE tour_id IN (?)`,
        [tourIds]
      );
      console.log(`🗑️ Deleted ${tourDriverDelete.affectedRows} row(s) from tour_driver`);

      const [tourInfoDelete]: any = await conn.query(
        `DELETE FROM tourinfo_master WHERE id IN (?)`,
        [tourIds]
      );
      console.log(`🗑️ Deleted ${tourInfoDelete.affectedRows} row(s) from tourinfo_master`);
    } else {
      console.log(`ℹ️ No future/current tours found for the given drivers.`);
    }

    // 4. Instead of deleting, update is_active = 0 in users
    if (userIds.length > 0) {
      const [userUpdate]: any = await conn.query(
        `UPDATE users SET is_active = 0 WHERE user_id IN (?)`,
        [userIds]
      );
      console.log(`🛑 Set is_active = 0 for ${userUpdate.affectedRows} user(s)`);
    }

    // 5. Do NOT delete from driver_details
    console.log(`🚫 Skipped deleting from driver_details. Drivers deactivated instead.`);

    await conn.commit();
    console.log(`✅ Transaction committed for multiple driver deactivations.`);
    return validDriverIds.length;
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Error during bulk deactivation. Transaction rolled back.`, err);
    throw err;
  } finally {
    conn.release();
    console.log("🔚 Connection released after bulk driver deactivation");
    console.log("---------------------------------------------------------------------");
  }
};

export const evaluateDriverEligibility = async (driverId: number) => {
  console.log(`[Service] Evaluating driver eligibility for driver ID: ${driverId}`);

  // Step 1: Calculate start of the current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
console.log(`[Step 1] Start of current week (Monday): ${monday.toLocaleString()}`);

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
    [driverId, monday]
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
      message: "Driver has no tours this week. Eligible for assignment."
    };
  }

  // Step 4: Calculate total worked minutes from all tours
  let totalMinutes = 0;
  for (const row of rows) {
    if (row.duration_minutes !== null && !isNaN(row.duration_minutes)) {
      console.log(row.duration_minutes)
      totalMinutes += row.duration_minutes;
      console.log(`[Step 4] Tour ID ${row.tour_id}: added ${row.duration_minutes} minutes`);
    } else {
      console.warn(`[Step 4] Tour ID ${row.tour_id} has invalid duration.`);
    }
  }
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  console.log(`[Step 4] Total worked time this week: ${totalHours}h ${remainingMinutes}m`);

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
      : "Driver is not eligible: worked 40 or more hours this week."
  };
};