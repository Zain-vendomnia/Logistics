import pool from "../database";
import { RowDataPacket } from "mysql2";
import { LOGIC_ORDER_ITEMS_TABLE } from "../services/tableQueries";

const logisticOrderItemsSetup = async () => {
  const conn = await pool.getConnection();
  try {
    console.log("Checking if 'logistic_order_items' table exists...");

    const [rows] = await conn.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'logistic_order_items'"
    );

    if (rows.length > 0) {
      console.log("Table 'logistic_order_items' exists. Verifying structure...");
      // Optional: Add structure verification here
      return;
    }

    console.log("Creating 'logistic_order_items' table...");
    await conn.query("START TRANSACTION");
    await conn.query(LOGIC_ORDER_ITEMS_TABLE);
    await conn.query("COMMIT");
    console.log("Table created successfully.");
  } catch (error) {
    await conn.query("ROLLBACK");
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw to handle at higher level
  } finally {
    conn.release();
  }
};

export default logisticOrderItemsSetup;