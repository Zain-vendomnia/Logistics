import app from "./app";
import initialSetup from "./initialDBSetup/usersSetup";
import tourDriverSetup from "./initialDBSetup/tourDriverSetup";
import logisticOrderSetup from "./initialDBSetup/logisticOrderSetup";
import logisticOrderItemsSetup from "./initialDBSetup/logisticOrderItemsSetup";
import logisticPaymentSetup from "./initialDBSetup/logisticPaymentSetup";
import warehouseDetailsSetup from "./initialDBSetup/warehouseDetailsSetup";
import driverDetailsSetup from "./initialDBSetup/driverDetailsSetup";
import tourInfoMasterSetup from "./initialDBSetup/tourInfoMasterSetup";
import driverLocationsSetup from "./initialDBSetup/driverLocationsSetup";
import routeUpdatesSetup from "./initialDBSetup/routeUpdatesSetup";
import apiResponseLogSetup from "./initialDBSetup/apiResponseLogSetup";
import solarItemsSetup from "./initialDBSetup/solarmodulesItemsSetup";
import routeSegmentsSetup from "./initialDBSetup/routeSegmentsSetup";
import WMSOrderSetup from "./initialDBSetup/wms_orders";
import  vehicleDetailsSetup from "./initialDBSetup/vechileDetails";
import WMSOrderArticlesSetup from "./initialDBSetup/wms_order_articles";
import { shopwareOrderSync } from "./shopwareOrderSync";
import { wmsOrderSync } from './wmsOrderSync';

import cron from "node-cron";
// Utility function for timestamped logs
function logWithTime(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function main() {
  try {
    // 1. Run all DB setup scripts before starting the app
    logWithTime("🚀 Running initial database setup...");

    await initialSetup();
    await logisticOrderSetup();
    await logisticPaymentSetup();
    await warehouseDetailsSetup();
    await driverDetailsSetup();
    await vehicleDetailsSetup();
    await tourInfoMasterSetup();
    await driverLocationsSetup();
    await routeSegmentsSetup();
    await WMSOrderSetup();
    await WMSOrderArticlesSetup();
    await tourDriverSetup();
    await logisticOrderItemsSetup();
    await routeUpdatesSetup();
    await apiResponseLogSetup();
    await solarItemsSetup();

    logWithTime("✅ Database setup completed successfully.");

    // 2. Start the API server
    app.listen(app.get("port"), async () => {
      // logWithTime(`🚀 Server is running on port ${app.get("port")}`);

      // 3. Run the Shopware sync immediately on startup
      try {
        logWithTime("⏳ Running initial Shopware Order Sync...");
        await shopwareOrderSync();
        logWithTime("✅ Initial Shopware Order Sync completed.");
        //  -----------------------------------------------------
        await wmsOrderSync('2024-06-29');
        logWithTime("✅ Initial WMS Order Sync completed.");
        
      } catch (error) {
        logWithTime("❌ Initial Shopware Order Sync failed:");
        console.error(error);
      }

      // 4. Schedule Shopware sync every 15 minutes
      cron.schedule("*/15 * * * *", async () => {
        logWithTime("⏳ Cron triggered: Running Shopware Order Sync...");
        try {
          await shopwareOrderSync();
          logWithTime("✅ Shopware Order Sync completed.");
        } catch (err) {
          logWithTime("❌ Shopware Order Sync failed:");
          console.error(err);
        }
      });

      cron.schedule("*/30 * * * *", async () => {
        logWithTime("⏳ Cron triggered: Running WMS Order Sync...");
        try {
          await wmsOrderSync('2024-06-29');
          logWithTime("✅ WMS Order Sync completed.");
        } catch (err) {
          logWithTime("❌ WMS Order Sync failed:");
          console.error(err);
        }
      });

      console.log("--------------------------------------------------------------------------------------------------------------------------");
    });

  } catch (error) {
    logWithTime("❌ Error during database setup:");
    console.error(error);
    process.exit(1); // Exit if setup fails
  }
}

main();
