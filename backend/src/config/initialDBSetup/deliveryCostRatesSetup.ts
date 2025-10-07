import pool from "../database";
import { RowDataPacket } from "mysql2";
import {
  CREATE_Delivery_Cost_Rates_TABLE,
  INSERT_Delivery_Cost_Rates_TABLE,
} from "../../services/tableQueries";

const deliveryCostRatesSetup = async () => {
  try {
    console.log("Checking if 'delivery_cost_rates' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'delivery_cost_rates'"
    );
    if (rows.length > 0) {
      console.log(
        "Table 'delivery_cost_rates' already exists. No changes made."
      );
      return;
    }

    console.log("Table not found. Creating 'delivery_cost_rates' table...");

    console.log("Table not found. Creating 'delivery_cost_rates' table...");
    await pool.query(CREATE_Delivery_Cost_Rates_TABLE);
    await pool.query(INSERT_Delivery_Cost_Rates_TABLE);
    console.log("Table 'delivery_cost_rates' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default deliveryCostRatesSetup;
