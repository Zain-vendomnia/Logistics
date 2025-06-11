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
import WMSOrderArticlesSetup from "./initialDBSetup/wms_order_articles";
import { syncOrderData } from "./orderSync";
import { fetchScheduleOrderInfo,fetchScheduleWmsOrderInfo } from './services/scheduleFetching';

async function main() {
  try {
    await initialSetup();
    await logisticOrderSetup();
    await logisticPaymentSetup();
    await warehouseDetailsSetup();
    await driverDetailsSetup();
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

    
    app.listen(app.get("port"), async () => {
      // Now fetch and insert order data only after tables exist
      try {
        await syncOrderData();
        console.log("Order data synced successfully.");
        // Call immediately after server start
        fetchScheduleWmsOrderInfo();

        setInterval(fetchScheduleOrderInfo, 900000); // 900,000 ms = 15 minutes
        setInterval(fetchScheduleWmsOrderInfo, 1800000); // 900,000 ms = 30 minutes
      } catch (error) {
        console.error("Error syncing order data:", error);
      }
    });

  } catch (error) {
    console.error("Error during database setup:", error);
    process.exit(1); // Exit if setup fails
  }
}

main();
