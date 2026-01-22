import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_ORDER_IMAGES_TABLE } from "../tableQueries";

const orderImagesSetup = async () => {
  try {
    console.log("Checking if 'order_images' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'order_images'",
    );
    if (rows.length > 0) {
      console.log("Table 'order_images' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'order_images' table...");
    await pool.query(CREATE_ORDER_IMAGES_TABLE);
    console.log("Table 'order_images' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

export default orderImagesSetup;
