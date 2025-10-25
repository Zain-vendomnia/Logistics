import { logWithTime } from "../../utils/logging";
import { shopwareOrderSync } from "../shopwareOrderSync";
import { wmsOrderSync } from "../wmsOrderSync";

export async function runInitialSyncs() {
  try {
    logWithTime("⏳ Running initial Shopware sync...");
    await shopwareOrderSync();
    
    logWithTime("⏳ Running initial WMS order sync...");
    await wmsOrderSync("2025-10-01");
  } catch (error) {
    logWithTime("❌ Initial sync failed:");
    console.error(error);
  }
}