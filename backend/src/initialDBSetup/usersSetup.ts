import bcrypt from "bcryptjs";
import connect from "../database";
import { RowDataPacket } from 'mysql2';  // Add this import
import { USERS_TABLE } from "../services/tableQueries";

const initialSetup = async () => {
  const conn = await connect();
  try {
   

    // Create users table if not exists
    await conn.query(USERS_TABLE);
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
