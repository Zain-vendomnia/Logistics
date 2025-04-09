import connect from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_WAREHOUSE_DETAILS_TABLE } from "../services/tableQueries";

const warehouseDetailsSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'warehouse_details' table exists...");

    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'warehouse_details'");
    if (rows.length > 0) {
      console.log("Table 'warehouse_details' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'warehouse_details' table...");
    await conn.query(CREATE_WAREHOUSE_DETAILS_TABLE);
    console.log("Table 'warehouse_details' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end();
  }
};

export default warehouseDetailsSetup;
