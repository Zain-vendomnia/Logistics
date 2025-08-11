import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../database";
import { RowDataPacket } from "mysql2";
import { User } from "../interface/interface";
import bcrypt from "bcryptjs";
import config from "../config";

export async function signup(req: Request, res: Response) {
  try {
    const { username, email, password, role = "driver" } = req.body;

    // 1. Check if the user already exists in users table
    const [existingUser] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(200).json({ message: "Username or email already in use" });
    }

    // 2. Check if the driver exists in driver_details table
    const [driver] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM driver_details WHERE name = ? AND email = ?",
      [username, email]
    );

    if (driver.length === 0) {
      return res.status(404).json({
        message: "Driver not found in driver_details. Please contact admin.",
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user object
    const newUser: User = {
      username,
      email,
      password: hashedPassword,
      role,
    };

    // 5. Insert into users table
    const [insertResult] = await pool.query<any>(
      "INSERT INTO users SET ?",
      [newUser]
    );
    const userId = insertResult.insertId;

    // 6. Update driver_details with user_id
    await pool.query(
      "UPDATE driver_details SET user_id = ? WHERE name = ? AND email = ?",
      [userId, username, email]
    );

    // 7. Create JWT token
    const token = jwt.sign({ user_id: userId, role }, config.SECRET, {
      expiresIn: "14h",
    });

    // 8. Return success response
    return res.status(201).json({
      message: "User created successfully",
      token,
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    } else {
      return res.status(400).json({ message: "An unknown error occurred" });
    }
  }
}


export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // 1) Authenticate by email
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    // 2) Check if the user is active
    if (user.is_active === 0) {
      return res.status(403).json({ message: "Account is inactive. Please contact support." });
    }

    // 3) Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // 4) Generate JWT
    const accessToken = jwt.sign(
      { user_id: user.user_id, role: user.role },
      config.SECRET,
      { expiresIn: "1h" }
    );

    // ✅ declare in outer scope so it’s available for the final response
    let driverId: number | null = null;
    let todayTour:
      | { tour_id: number | null; tour_date: string | null; message?: string }
      | null = null;

    // 5) If driver, fetch today’s tour
    if (user.role === "driver") {
      const [drivers] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM driver_details WHERE user_id = ?",
        [user.user_id]
      );

      if (drivers.length > 0) {
        driverId = drivers[0].id as number;

        const [tours] = await pool.query<RowDataPacket[]>(
          `SELECT 
             tour_id, 
             DATE_FORMAT(CONVERT_TZ(tour_date, '+00:00', '+05:30'), '%Y-%m-%d') AS tour_date
           FROM tour_driver
           WHERE driver_id = ?
             AND DATE(CONVERT_TZ(tour_date, '+00:00', '+05:30')) = CURDATE()`,
          [driverId]
        );

        if (tours.length > 0) {
          todayTour = {
            tour_id: tours[0].tour_id as number,
            tour_date: tours[0].tour_date as string,
          };
        } else {
          todayTour = { tour_id: null, tour_date: null, message: "No tour assigned for today" };
        }
      } else {
        todayTour = { tour_id: null, tour_date: null, message: "Driver profile not found" };
      }
    }

    // 6) Return response
    return res.status(200).json({
      accessToken,
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      driver_id: driverId,
      role: user.role,
      todayTour,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
