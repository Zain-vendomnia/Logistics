import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); 

const pool = createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "logistics",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
