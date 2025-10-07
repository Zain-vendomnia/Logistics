import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_DRIVER_LOCATIONS_TABLE } from "../../services/tableQueries";

const driverLocationsSetup = async () => {
  try {
    console.log("Checking if 'driver_locations' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'driver_locations'"
    );
    if (rows.length > 0) {
      console.log("Table 'driver_locations' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'driver_locations' table...");
    await pool.query(CREATE_DRIVER_LOCATIONS_TABLE);
    console.log("Table 'driver_locations' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default driverLocationsSetup;
