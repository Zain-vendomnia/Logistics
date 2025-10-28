import cron from "node-cron";
import { shopwareOrderSync } from "../shopwareOrderSync";
import { wmsOrderSync } from "../wmsOrderSync";
import { logWithTime } from "../../utils/logging";

export function scheduleRecurringSyncs() {
  cron.schedule("*/15 * * * *", async () => {
    logWithTime("⏳ Cron: Shopware sync started...");
    try {
      await shopwareOrderSync();
      logWithTime("✅ Shopware sync completed.");
    } catch (err) {
      logWithTime("❌ Shopware sync failed:");
      console.error(err);
    }
  });

  cron.schedule("*/30 * * * *", async () => {
    logWithTime("⏳ Cron: WMS sync started...");
    try {
      await wmsOrderSync("2025-10-01");
      logWithTime("✅ WMS sync completed.");
    } catch (err) {
      logWithTime("❌ WMS sync failed:");
      console.error(err);
    }
  });
}
