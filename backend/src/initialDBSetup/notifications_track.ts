import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_NOTIFICATION_TABLE } from "../services/tableQueries";

const NotificationsTrackSetup = async () => {
 
  try {
    console.log("Checking if 'notifications_track' table exists...");

    const [rows] = await pool.query<RowDataPacket[]>("SHOW TABLES LIKE 'notifications_track'");
    if (rows.length > 0) {
      console.log("Table 'notifications_track' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'notifications_track' table...");
    await pool.query(CREATE_NOTIFICATION_TABLE);
    console.log("Table 'notifications_track' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } 
};

export default NotificationsTrackSetup;
