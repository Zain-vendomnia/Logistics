import pool from "../database";
import { RowDataPacket } from "mysql2";
import { LOGIC_ORDER_ITEMS_TABLE } from "../services/tableQueries";

const logisticOrderItemsSetup = async () => {
  
  try {
    console.log("Checking if 'logistic_order_items' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'logistic_order_items'"
    );

    if (rows.length > 0) {
      console.log("Table 'logistic_order_items' exists. Verifying structure...");
      // Optional: Add structure verification here
      return;
    }

    console.log("Creating 'logistic_order_items' table...");
    await pool.query("START TRANSACTION");
    await pool.query(LOGIC_ORDER_ITEMS_TABLE);
    await pool.query("COMMIT");
    console.log("Table created successfully.");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw to handle at higher level
  }
};

export default logisticOrderItemsSetup;