import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_DRIVER_DETAILS_TABLE } from "../tableQueries";

const driverDetailsSetup = async () => {
  try {
    console.log("Checking if 'driver_details' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'driver_details'",
    );
    if (rows.length > 0) {
      console.log("Table 'driver_details' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'driver_details' table...");
    await pool.query(CREATE_DRIVER_DETAILS_TABLE);
    console.log("Table 'driver_details' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default driverDetailsSetup;
