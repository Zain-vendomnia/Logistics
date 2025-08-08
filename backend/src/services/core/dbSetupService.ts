import initialSetup from "../../initialDBSetup/usersSetup";
import apiResponseLogSetup from "../../initialDBSetup/apiResponseLogSetup";
import driverDetailsSetup from "../../initialDBSetup/driverDetailsSetup";
import driverLocationsSetup from "../../initialDBSetup/driverLocationsSetup";
import logisticOrderItemsSetup from "../../initialDBSetup/logisticOrderItemsSetup";
import logisticOrderSetup from "../../initialDBSetup/logisticOrderSetup";
import logisticPaymentSetup from "../../initialDBSetup/logisticPaymentSetup";
import routeSegmentsSetup from "../../initialDBSetup/routeSegmentsSetup";
import routeUpdatesSetup from "../../initialDBSetup/routeUpdatesSetup";
import solarItemsSetup from "../../initialDBSetup/solarmodulesItemsSetup";
import tourDriverSetup from "../../initialDBSetup/tourDriverSetup";
import tourInfoMasterSetup from "../../initialDBSetup/tourInfoMasterSetup";
import warehouseDetailsSetup from "../../initialDBSetup/warehouseDetailsSetup";
import WMSOrderSetup from "../../initialDBSetup/wms_orders";
import WMSOrderArticlesSetup from "../../initialDBSetup/wms_order_articles";

export async function runInitialDbSetup() {
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
}
