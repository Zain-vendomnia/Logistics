import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_TOUR_TRACES_TABLE } from "../tableQueries";

const TourTracesSetup = async () => {
  try {
    console.log("Checking if 'tour_traces' table exists...");

    // Ensure correct type casting
    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'tour_traces'",
    );
    if (rows.length > 0) {
      console.log("Table 'tour_traces' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'tour_traces' table...");

    // Execute the query to create the table
    await pool.query(CREATE_TOUR_TRACES_TABLE);
    console.log("Table 'tour_traces' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default TourTracesSetup;
