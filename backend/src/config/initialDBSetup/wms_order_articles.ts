import pool from "../database";
import { RowDataPacket } from "mysql2";
import { WMS_ORDER_ARTICLES } from "../tableQueries";

const WMSOrderArticlesSetup = async () => {
  try {
    console.log("Checking if 'WMS_ORDER_ARTICLES' table exists...");

    // Ensure correct type casting
    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'WMS_ORDER_ARTICLES'",
    );
    if (rows.length > 0) {
      console.log(
        "Table 'WMS_ORDER_ARTICLES' already exists. No changes made.",
      );
      return;
    }

    console.log("Table not found. Creating 'WMS_ORDER_ARTICLES' table...");

    // Execute the query to create the table
    await pool.query(WMS_ORDER_ARTICLES);
    console.log("Table 'WMS_ORDER_ARTICLES' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default WMSOrderArticlesSetup;
