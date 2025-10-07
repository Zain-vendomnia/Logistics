import pool from "../database";
import { RowDataPacket } from "mysql2";
import {
  CREATE_WAREHOUSE_DETAILS_TABLE,
  INSERT_WAREHOUSE_DETAILS_DATA,
} from "../../services/tableQueries";

const warehouseDetailsSetup = async () => {
  try {
    console.log("Checking if 'warehouse_details' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'warehouse_details'"
    );
    if (rows.length > 0) {
      console.log("Table 'warehouse_details' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'warehouse_details' table...");
    await pool.query(CREATE_WAREHOUSE_DETAILS_TABLE);
    await pool.query(INSERT_WAREHOUSE_DETAILS_DATA);
    console.log("Table 'warehouse_details' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default warehouseDetailsSetup;
