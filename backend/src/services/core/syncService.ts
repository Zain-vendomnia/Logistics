import { logWithTime } from "../../utils/logging";
import { shopwareOrderSync } from "../shopwareOrderSync";
import { wmsOrderSync } from "../wmsOrderSync";

export async function runInitialSyncs() {
  try {
    logWithTime("⏳ Running initial Shopware sync...");
    await shopwareOrderSync();
    
    logWithTime("⏳ Running initial WMS order sync...");
<<<<<<< HEAD
    await wmsOrderSync("2024-01-10");
    logWithTime("✅ WMS order sync completed.");
=======
    await wmsOrderSync("2025-08-10");
>>>>>>> origin/main
  } catch (error) {
    logWithTime("❌ Initial sync failed:");
    console.error(error);
  }
}
