import { logWithTime } from "../../utils/logging";
import { fetchScheduleWmsOrderInfo } from "../scheduleFetching";
import { shopwareOrderSync } from "../shopwareOrderSync";

export async function runInitialSyncs() {
  try {
    logWithTime("⏳ Running initial Shopware sync...");
    await shopwareOrderSync();
    logWithTime("✅ Shopware sync completed.");

    logWithTime("⏳ Running initial WMS order sync...");
    await fetchScheduleWmsOrderInfo();
    logWithTime("✅ WMS order sync completed.");
  } catch (error) {
    logWithTime("❌ Initial sync failed:");
    console.error(error);
  }
}
