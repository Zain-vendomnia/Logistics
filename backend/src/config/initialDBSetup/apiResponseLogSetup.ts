import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_API_RESPONSE_LOG_TABLE } from "../../services/tableQueries";

const apiResponseLogSetup = async () => {
  try {
    console.log("Checking if 'api_response_log' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'api_response_log'"
    );
    if (rows.length > 0) {
      console.log("Table 'api_response_log' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'api_response_log' table...");
    await pool.query(CREATE_API_RESPONSE_LOG_TABLE);
    console.log("Table 'api_response_log' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default apiResponseLogSetup;
