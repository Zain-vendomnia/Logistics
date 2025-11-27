import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_CUSTOMER_CHATS_TABLE } from "../../services/tableQueries";

const CustomerChatsSetup = async () => {
  try {
    console.log("Checking if 'whatsapp_chats' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'whatsapp_chats'"
    );
    if (rows.length > 0) {
      console.log("Table 'whatsapp_chats' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'whatsapp_chats' table...");
    await pool.query(CREATE_CUSTOMER_CHATS_TABLE);
    console.log("Table 'whatsapp_chats' successfully created.");
  } catch (error) {
    console.error(
      "Error during table setup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default CustomerChatsSetup;