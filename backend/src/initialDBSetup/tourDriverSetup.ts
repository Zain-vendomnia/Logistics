import pool from "../database";
import { TOUR_DRIVER } from "../services/tableQueries";

const tourDriverSetup = async () => {
  try {
    await pool.query(TOUR_DRIVER);
    console.log("✅ Table `tour_driver` created or already exists.");
  } catch (error) {
    console.error("❌ Error creating `tour_driver` table:", error instanceof Error ? error.message : error);
    // Optional if part of CLI script
    // process.exit(1);
  }
};

export default tourDriverSetup;
