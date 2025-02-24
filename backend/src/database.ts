import { Pool, createPool } from "mysql2/promise";

async function connect(): Promise<Pool> {
  const connection = await createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "logistics",
    connectionLimit: 5,
  });
  console.log("MySQL connected");
  return connection;
}

export default connect;
