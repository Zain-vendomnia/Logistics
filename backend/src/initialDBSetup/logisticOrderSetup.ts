import pool from "../database";
import { RowDataPacket } from "mysql2";
import { LOGIC_ORDER_TABLE } from "../services/tableQueries";

const logisticOrderSetup = async () => {
 
  try {
    console.log("Checking if 'logistic_order' table exists...");

    // Ensure correct type casting
    const [rows] = await pool.query<RowDataPacket[]>("SHOW TABLES LIKE 'logistic_order'");
    if (rows.length > 0) {
      console.log("Table 'logistic_order' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'logistic_order' table...");

    // Execute the query to create the table
    await pool.query(LOGIC_ORDER_TABLE);
    console.log("Table 'logistic_order' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } 
};

export default logisticOrderSetup;
