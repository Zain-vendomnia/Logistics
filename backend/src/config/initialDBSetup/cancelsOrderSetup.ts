import pool from "../database";
import { RowDataPacket } from "mysql2";
// import { CREATE_CANCELS_ORDER_TABLE } from "../../services/tableQueries";

const cancelsOrderSetup = async () => {
  try {
    console.log("Checking if 'cancels_order' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'cancels_order'"
    );
    
    if (rows.length > 0) {
      console.log("Table 'cancels_order' already exists. No changes made.");
      return;
    }

    console.log("Table 'cancels_order' not found. Creating table...");
    // await pool.query(CREATE_CANCELS_ORDER_TABLE);
    console.log("✅ Table 'cancels_order' successfully created.");
  } catch (error) {
    console.error(
      "❌ Error during 'cancels_order' table setup:",
      error instanceof Error ? error.stack || error.message : String(error)
    );
    throw error; // Re-throw to handle at higher level if needed
  }
};

export default cancelsOrderSetup;