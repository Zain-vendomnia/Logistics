import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_ROUTE_SEGMENTS_TABLE } from "../tableQueries";

const routeSegmentsSetup = async () => {
  try {
    console.log("Checking if 'route_segments' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'route_segments'",
    );
    if (rows.length > 0) {
      console.log("Table 'route_segments' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'route_segments' table...");
    await pool.query(CREATE_ROUTE_SEGMENTS_TABLE);
    console.log("Table 'route_segments' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default routeSegmentsSetup;
