import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_Delivery_Cost_Per_Tour_Table } from "../tableQueries";

const deliveryCostPerToursSetup = async () => {
  try {
    console.log("Checking if 'delivery_cost_per_tour' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'delivery_cost_per_tour'",
    );
    if (rows.length > 0) {
      console.log(
        "Table 'delivery_cost_per_tour' already exists. No changes made.",
      );
      return;
    }

    console.log("Table not found. Creating 'delivery_cost_per_tour' table...");

    await pool.query(CREATE_Delivery_Cost_Per_Tour_Table);
    console.log("Table 'delivery_cost_per_tour' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default deliveryCostPerToursSetup;
