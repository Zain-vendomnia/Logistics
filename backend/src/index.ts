import app from "./app";
import initialSetup from "./initialDBSetup/usersSetup";
import logisticOrderSetup from "./initialDBSetup/logisticOrderSetup";
import logisticOrderItemsSetup from "./initialDBSetup/logisticOrderItemsSetup";
import logisticPaymentSetup from "./initialDBSetup/logisticPaymentSetup";
import warehouseDetailsSetup from "./initialDBSetup/warehouseDetailsSetup";
import driverDetailsSetup from "./initialDBSetup/driverDetailsSetup";
import tourInfoMasterSetup from "./initialDBSetup/tourInfoMasterSetup";
import driverLocationsSetup from "./initialDBSetup/driverLocationsSetup";
import routeUpdatesSetup from "./initialDBSetup/routeUpdatesSetup";
import apiResponseLogSetup from "./initialDBSetup/apiResponseLogSetup";
import routeSegmentsSetup from "./initialDBSetup/routeSegmentsSetup";
import WMSOrderSetup from "./initialDBSetup/wms_orders";
import WMSOrderArticlesSetup from "./initialDBSetup/wms_order_articles";
import { syncOrderData } from "./orderSync";

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
    await logisticOrderItemsSetup();
    await routeUpdatesSetup();
    await apiResponseLogSetup();

    
    app.listen(app.get("port"), async () => {
      // Now fetch and insert order data only after tables exist
      try {
        await syncOrderData();
        console.log("Order data synced successfully.");
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
