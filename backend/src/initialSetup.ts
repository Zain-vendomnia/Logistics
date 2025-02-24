import bcrypt from "bcryptjs";
import connect from "./database";
import { RowDataPacket } from 'mysql2';  // Add this import

const initialSetup = async () => {
  const conn = await connect();
  try {
    // Check if the tables exist and create them if they don't
    const createUserTableQuery = `
      CREATE TABLE IF NOT EXISTS users(
        user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(30) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',  -- Adding role field with default 'user'
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create users table if not exists
    await conn.query(createUserTableQuery);
    console.log("Table USER created or already exists");

      // Check if the admin user already exists to avoid creating a duplicate
    const [existingAdmin] = await conn.query("SELECT * FROM users WHERE username = 'admin'");

    // Check if existingAdmin is an array and has rows (length > 0)
    if ((existingAdmin as RowDataPacket[]).length === 0) {
      // If the admin user doesn't exist, create the user with a hashed password
      const hashedPassword = await bcrypt.hash('0000', 10); // Hash the password using bcrypt
      await conn.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        ['admin', 'admin@system.com', hashedPassword, 'admin'] // Insert with 'admin' role
      );
      console.log("Admin user created successfully with role 'admin'");
    } else {
      console.log("Admin user already exists");
    }

  } catch (error) {
    console.error("Error during initial setup:", error);
  }
};

export default initialSetup;
