import { Request, Response } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";

export async function getAllUsers(_req: Request, res: Response) {
  try {
    // Fetch all users from the database
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, username, email, role FROM users"
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    return res.status(200).json(users); // Send the list of users
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ message: "An unknown error occurred" });
  }
}

// Fetch user details based on the JWT token
export async function getUserDetails(req: Request, res: Response) {
  try {
    const headerToken = req.headers["authorization"];
    if (headerToken) {
      const bearerToken = headerToken.slice(7); // Remove "Bearer " from token
      const tokenData = (await jwt.decode(bearerToken)) as jwt.JwtPayload;

      // Fetch user details from the database using the user_id from the token

      const [user] = await pool.query<RowDataPacket[]>(
        "SELECT username, email FROM users WHERE user_id = ?",
        [tokenData?.user_id]
      );

      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user[0]);
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (error: unknown) {
    // Typecast the error as an instance of Error to access the `message` property
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ message: "An unknown error occurred" });
  }
}
