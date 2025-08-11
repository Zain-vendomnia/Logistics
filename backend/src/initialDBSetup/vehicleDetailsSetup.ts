import pool from "../database";
import { RowDataPacket } from "mysql2";
import {
  CREATE_VEHICLE_DETAILS_TABLE,
  INSERT_VEHICLE_DETAILS_DATA,
} from "../services/tableQueries";

const vehicleDetailsSetup = async () => {
  try {
    console.log("Checking if 'vehicle_details' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'vehicle_details'"
    );
    if (rows.length > 0) {
      console.log("Table 'vehicle_details' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'vehicle_details' table...");
    await pool.query(CREATE_VEHICLE_DETAILS_TABLE);
    await pool.query(INSERT_VEHICLE_DETAILS_DATA);
    console.log("Table 'vehicle_details' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default vehicleDetailsSetup;
