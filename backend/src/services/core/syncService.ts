import { logWithTime } from "../../utils/logging";
import { shopwareOrderSync } from "../shopwareOrderSync";
import { wmsOrderSync } from "../wmsOrderSync";

export async function runInitialSyncs() {
  try {
    logWithTime("⏳ Running initial Shopware sync...");
    await shopwareOrderSync();
    logWithTime("✅ Shopware sync completed.");
    
    logWithTime("⏳ Running initial WMS order sync...");
    await wmsOrderSync("2025-08-10");
    logWithTime("✅ WMS order sync completed.");
  } catch (error) {
    logWithTime("❌ Initial sync failed:");
    console.error(error);
  }
}
