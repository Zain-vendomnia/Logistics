import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_RETURNS_ORDER_ITEMS_TABLE } from "../../services/tableQueries";

const returnsOrderItemsSetup = async () => {
  try {
    console.log("Checking if 'returns_order_items' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'returns_order_items'"
    );
    
    if (rows.length > 0) {
      console.log("Table 'returns_order_items' already exists. No changes made.");
      return;
    }

    console.log("Table 'returns_order_items' not found. Creating table...");
    await pool.query(CREATE_RETURNS_ORDER_ITEMS_TABLE);
    console.log("✅ Table 'returns_order_items' successfully created.");
  } catch (error) {
    console.error(
      "❌ Error during 'returns_order_items' table setup:",
      error instanceof Error ? error.stack || error.message : String(error)
    );
    throw error; // Re-throw to handle at higher level if needed
  }
};

export default returnsOrderItemsSetup;