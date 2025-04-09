import connect from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_TOUR_INFO_MASTER_TABLE } from "../services/tableQueries";

const tourInfoMasterSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'tourInfo_master' table exists...");

    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'tourInfo_master'");
    if (rows.length > 0) {
      console.log("Table 'tourInfo_master' already exists. No changes made.");
      return;
    }

    console.log("Table not found. Creating 'tourInfo_master' table...");
    await conn.query(CREATE_TOUR_INFO_MASTER_TABLE);
    console.log("Table 'tourInfo_master' successfully created.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    await conn.end();
  }
};

export default tourInfoMasterSetup;
