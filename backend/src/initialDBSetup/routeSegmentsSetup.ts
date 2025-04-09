import connect from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_ROUTE_SEGMENTS_TABLE } from "../services/tableQueries";

const routeSegmentsSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'route_segments' table exists...");

    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'route_segments'");
    if (rows.length > 0) {
      console.log("Table 'route_segments' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'route_segments' table...");
    await conn.query(CREATE_ROUTE_SEGMENTS_TABLE);
    console.log("Table 'route_segments' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end();
  }
};

export default routeSegmentsSetup;
