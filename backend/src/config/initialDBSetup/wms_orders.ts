import pool from "../database";
import { RowDataPacket } from "mysql2";
import { WMS_ORDER } from "../../services/tableQueries";

const WMSOrderSetup = async () => {
  try {
    console.log("Checking if 'WMS ORDER' table exists...");

    // Ensure correct type casting
    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'WMS ORDER'"
    );
    if (rows.length > 0) {
      console.log("Table 'WMS ORDER' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'WMS ORDER' table...");

    // Execute the query to create the table
    await pool.query(WMS_ORDER);
    console.log("Table 'WMS ORDER' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default WMSOrderSetup;
