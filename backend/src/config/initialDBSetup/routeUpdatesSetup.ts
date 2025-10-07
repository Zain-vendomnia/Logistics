import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_ROUTE_UPDATES_TABLE } from "../../services/tableQueries";

const routeUpdatesSetup = async () => {
  try {
    console.log("Checking if 'route_updates' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'route_updates'"
    );
    if (rows.length > 0) {
      console.log("Table 'route_updates' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'route_updates' table...");
    await pool.query(CREATE_ROUTE_UPDATES_TABLE);
    console.log("Table 'route_updates' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default routeUpdatesSetup;
