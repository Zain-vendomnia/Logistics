import pool from "../database";
import { RowDataPacket } from "mysql2";
import { ORDER_STATUS_HISTORY_TABLE } from "../tableQueries";

const logisticOrderStatusHistorySetup = async () => {
  try {
    console.log("Checking if 'logistic_order_status_history' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'order_status_history'",
    );

    if (rows.length > 0) {
      console.log(
        "Table 'order_status_history' exists. Verifying structure...",
      );
      // Optional: Add structure verification here
      return;
    }

    console.log("Creating 'order_status_history' table...");
    await pool.query("START TRANSACTION");
    await pool.query(ORDER_STATUS_HISTORY_TABLE);
    await pool.query("COMMIT");
    console.log("Table created successfully.");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
    throw error; // Re-throw to handle at higher level
  }
};

export default logisticOrderStatusHistorySetup;
