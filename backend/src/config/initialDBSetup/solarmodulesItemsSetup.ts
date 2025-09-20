import pool from "../database";
import { RowDataPacket } from "mysql2";
import { CREATE_SOLARMODULES_ITEMS_TABLE } from "../../services/tableQueries";

const defaultSolarItems = [
  { slmdl_code: "SLMDL550P-00-00-00", weight: 26.5 },
  { slmdl_code: "SLMDL450N-SF-00-00", weight: 21.0 },
  { slmdl_code: "SLMDL580N-BF-BF-00", weight: 26.5 },
  { slmdl_code: "SLMDL440N-BF-BF-00", weight: 21.0 },
  { slmdl_code: "SLMDL440N-BF-BF-00", weight: 21.0 }, // Duplicate
  { slmdl_code: "SLMDL450N-BF-00-00", weight: 21.0 },
  { slmdl_code: "SLMDL425P-00-00-00", weight: 21.0 },
  { slmdl_code: "SLMDL450N-SF-00-00", weight: 21.0 }, // Duplicate
  { slmdl_code: "SLMDL460N-FB-BF-GG", weight: 24.0 },
];

const solarItemsSetup = async () => {
  try {
    console.log("Checking if 'solarmodules_items' table exists...");

    const [tables] = await pool.query<RowDataPacket[]>(
      "SHOW TABLES LIKE 'solarmodules_items'"
    );
    if (tables.length === 0) {
      console.log("Table not found. Creating 'solarmodules_items' table...");
      await pool.query(CREATE_SOLARMODULES_ITEMS_TABLE);
      console.log("Table 'solarmodules_items' successfully created.");
    } else {
      console.log("Table 'solarmodules_items' already exists.");
    }

    // Check if the table has any rows
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM solarmodules_items"
    );
    const rowCount = rows[0]?.count || 0;

    if (rowCount === 0) {
      console.log("Table is empty. Inserting default solar module items...");

      const insertQuery = `
        INSERT INTO solarmodules_items (module_name, weight, updated_by)
        VALUES ?
      `;
      const values = defaultSolarItems.map((item) => [
        item.slmdl_code,
        item.weight,
        "system",
      ]);

      await pool.query(insertQuery, [values]);
      console.log("Default solar module items inserted.");
    } else {
      console.log("Table already has data. No items inserted.");
    }
  } catch (error) {
    console.error(
      "Error during solarItemsSetup:",
      error instanceof Error ? error.message : String(error)
    );
  }
};

export default solarItemsSetup;
