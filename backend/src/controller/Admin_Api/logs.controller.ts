import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import config from "../../config/config";

const MONGO_URI = config.LOGGING_URL;
const client = new MongoClient(MONGO_URI);
const DB_NAME = "test";
const COLLECTION = "application_logs";

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db(DB_NAME);
    return db.collection(COLLECTION);
  } catch (err) {
    console.log("MongoDB connection error:", err);
  }
}

export const fetchAppLogs = async (_req: Request, res: Response) => {
  try {
    const logsCollection = await connect();
    const logs = await logsCollection!
      .find({})
      .sort({ timestamp: -1 }) // newest first
      .limit(100)
      .toArray();

    console.log("Logs length: ", logs.length);
    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Error fetching logs" });
  }
};
