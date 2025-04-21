import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../database";
import { RowDataPacket } from "mysql2";
import { User } from "../interface/interface";
import bcrypt from "bcryptjs";
import config from "../config";

export async function signup(req: Request, res: Response) {
  try {
    const { body } = req;
   

    // Check if the username already exists
    const [t] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE username = ? ",
      [body.username]
    );

    if (t.length > 0) {
      return res.status(200).json({ message: "Username or email already in use" });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(body.password, salt);

   
    const role = body.role || 'driver'; 

    // Create new user object
    const newUser: User = {
      username: body.username,
      email: body.email,
      password: encryptedPassword,
      role: role, 
    };

    // Insert new user into the database
    const [result] = await pool.query<any>("INSERT INTO users SET ?", [newUser]);

    // Generate JWT token with the user role
    const token = jwt.sign({ user_id: result.insertId, role: role }, config.SECRET, {
      expiresIn: "1h",
    });

    // Send response with success message and token
    res.status(201).json({
      message: "User created successfully",
      token: token,
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
  const { body } = req;
 

  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE username = ?",
    [body.username]
  );

  if (user.length === 0) {
    return res.status(400).json({ message: "User not found" });
  }

  const encryptedPassword: string = user[0].password;
  const isValidPassword = await bcrypt.compare(body.password, encryptedPassword);

  if (!isValidPassword) {
    return res.status(400).json({ message: "Incorrect password" });
  } else {
    // Generate JWT token with user_id and role
    const accessToken = jwt.sign({ user_id: user[0].user_id, role: user[0].role }, config.SECRET, { expiresIn: "1h" });
    return res.status(200).json({  accessToken , username: user[0].username, email : user[0].email, role: user[0].role       
    });
  }
}

