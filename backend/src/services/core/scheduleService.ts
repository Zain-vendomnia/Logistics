import cron from "node-cron";
import { shopwareOrderSync } from "../../shopwareOrderSync";
import { fetchScheduleWmsOrderInfo } from "../scheduleFetching";
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
      await fetchScheduleWmsOrderInfo();
      logWithTime("✅ WMS sync completed.");
    } catch (err) {
      logWithTime("❌ WMS sync failed:");
      console.error(err);
    }
  });
}
