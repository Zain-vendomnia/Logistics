import connect from "../database";
import { RowDataPacket } from "mysql2";
import { WMS_ORDER_ARTICLES } from "../services/tableQueries";

const WMSOrderArticlesSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'WMS_ORDER_ARTICLES' table exists...");

    // Ensure correct type casting
    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'WMS_ORDER_ARTICLES'");
    if (rows.length > 0) {
      console.log("Table 'WMS_ORDER_ARTICLES' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'WMS_ORDER_ARTICLES' table...");

    // Execute the query to create the table
    await conn.query(WMS_ORDER_ARTICLES);
    console.log("Table 'WMS_ORDER_ARTICLES' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end(); // Ensure proper closure of the connection
  }
};

export default WMSOrderArticlesSetup;
