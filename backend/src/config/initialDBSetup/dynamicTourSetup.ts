import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_DYNAMIC_TOURS_TABLE } from "../../services/tableQueries";

const DynamicTourSetup = async () => {
  try {
    console.log("Checking if 'dynamic_tours' table exists...");

    // Ensure correct type casting
    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'dynamic_tours'"
    );
    if (rows.length > 0) {
      console.log("Table 'dynamic_tours' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'dynamic_tours' table...");

    // Execute the query to create the table
    await pool.query(CREATE_DYNAMIC_TOURS_TABLE);
    console.log("Table 'dynamic_tours' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default DynamicTourSetup;
