import connect from "../database";
import { RowDataPacket } from "mysql2";
import { LOGIC_ORDER_TABLE } from "../services/tableQueries";

const logisticOrderSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'logistic_order' table exists...");

    // Ensure correct type casting
    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'logistic_order'");
    if (rows.length > 0) {
      console.log("Table 'logistic_order' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'logistic_order' table...");

    // Execute the query to create the table
    await conn.query(LOGIC_ORDER_TABLE);
    console.log("Table 'logistic_order' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end(); // Ensure proper closure of the connection
  }
};

export default logisticOrderSetup;
