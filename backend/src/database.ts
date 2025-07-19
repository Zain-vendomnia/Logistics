import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "logistics",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection on startup
async function testDBConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful.");
    connection.release();
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Failed to connect to the database:", error.message);
    } else {
      console.error("❌ Failed to connect to the database:", error);
    }
    process.exit(1); // Exit the app if connection fails
  }
}

testDBConnection();

export default pool;
