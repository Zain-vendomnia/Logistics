import { Router } from "express";
import roleCheck from "../middlewares/roleCheck";
import validateToken from "../middlewares/validateToken";

// Import controllers
import { optimizeRouteController } from "../controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "../controller/Admin_RouteOptimzation/updatelatlngController";
import * as orderCtrl from "../controller/Admin_RouteOptimzation/logisticOrder.controller";
import * as tourCtrl from "../controller/Admin_RouteOptimzation/tour.controller";
import { ExportTourController } from "../controller/Admin_RouteOptimzation/exportTourController";
import { getAllTourController } from "../controller/Admin_RouteOptimzation/getAllTourController";
import { updateCustomerInfoController } from "../controller/Admin_RouteOptimzation/updateCustomerInfo.controller";
import { getAllTourhistory } from "../controller/Admin_RouteOptimzation/getAllTourhistory";

import { getOrderCount } from "../controller/Admin_Api/orderCount.controller";
import { uploadImageController } from "../controller/Admin_Api/uploadImage.controller";
import { sendEmail } from "../controller/Admin_Api/sendEmail.controller";
import { insertParkingPermit } from "../controller/Admin_Api/insertParkingPermit.controller";
import { getOrderNotificationMetaData } from "../controller/Admin_Api/orderNotificationMetaData.controller";
import { updateOrderNotificationMetaData } from "../controller/Admin_Api/orderNotificationMetaData.controller";
import { getWarehouseById } from "../controller/Admin_Api/warehouseController";
import { getDriverById } from "../controller/Admin_Api/driverController";

import { HandleOrderDelivery } from "../controller/AdminDriverApi/HandleOrderDelivery";
import { getFilteredToursController } from "../controller/tourManagement.controller";
import { runTourController } from "../controller/dynamic/runTourController";
import { hereMapController } from "../controller/dynamic/hereMapController";

import driverRoutes from "./driver.routes";
import customerRoutes from "./customers.routes";
import vehicleRoutes from "./vehicle.routes";
import warehouseRoutes from "./warehouse.routes";
import * as dTourControler from "../controller/dynamic/dynamicTour.controller";
import cancelsRoutes from "./cancels.routes";

import { uploadDisk, uploadMemory } from "../middlewares/upload";
import { parseExcelToJobs } from "../utils/parseExcel";

import { notFoundHandler } from "../middlewares/notFoundHandler";
import * as shopware from "../controller/AdminDriverApi/shopwareOrderController";

import { orderSyncFromShopwareController } from "../controller/Admin_Api/orderSync.controller";
import { shopwareAuth } from "../middlewares/shopwareAuth";
import { fetchAppLogs } from "../controller/Admin_Api/logs.controller";

const adminRouter = Router();

// Public routes (no authentication required)
adminRouter.get("/customer/updatelatlng", updatelatlngController);
adminRouter.post("/sendEmail", sendEmail);
// adminRouter.post("/routeoptimize/getOrder", OrderCtrl.getAllLogisticOrders);
// adminRouter.post("/picklistEmail", picklistEmail);
// adminRouter.get("/routeoptimize/getOrder", orderCtrl.getLogisticOrderById);
// adminRouter.get("/routeoptimize/ordersWithItems", orderCtrl.getOrdersWithItems);
adminRouter.post("/insertParkingPermit", insertParkingPermit);
adminRouter.post("/getOrderNotificationMetaData", getOrderNotificationMetaData);
adminRouter.post(
  "/updateOrderNotificationMetaData",
  updateOrderNotificationMetaData
);
adminRouter.post("/getDriverById", getDriverById);

adminRouter.post("/Runtour", runTourController);

adminRouter.post(
  "/uploadexcel",
  uploadDisk.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Excel file is required." });
      }
      //console.log("testing");
      const jobList = parseExcelToJobs(req.file.path);

      // Pass jobList to the controller
      await dTourControler.create_dynamicTour(req, res, jobList);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to process uploaded Excel.",
        error: (err as Error).message,
      });
    }
  }
);

adminRouter.post("/order-sync", shopwareAuth, orderSyncFromShopwareController);

// Protected routes (each one applies validateToken + roleCheck)
adminRouter.use(validateToken, roleCheck(["admin"]));

adminRouter.post("/hereMapController", hereMapController);
// adminRouter.post("/dynamicTourController", dynamicTourCtrl.create_dynamicTour);

adminRouter.get("/dynamicTours", dTourControler.getDynamicTours);
adminRouter.post(
  "/orders/upload",
  uploadMemory.single("file"),
  dTourControler.uploadOrdersFromFile
);
adminRouter.post("/estimateTourMatrix", tourCtrl.estimateTourCostMatrix);
adminRouter.post("/createDynamicTour", dTourControler.createDynamicTour);
adminRouter.post("/acceptDynamicTour", dTourControler.acceptDynamicTour);
adminRouter.post("/rejectDynamicTour", dTourControler.rejectDynamicTour);

adminRouter.get("/pinboardOrders", orderCtrl.getPinboardOrders);
adminRouter.get("/tours", getFilteredToursController);

adminRouter.get("/route/routeoptimize/optimize", optimizeRouteController);

adminRouter.get("/routeoptimize/orders", orderCtrl.getAllLogisticOrders);

adminRouter.get("/routeoptimize/ordercount", orderCtrl.getcountcheck);

adminRouter.get(
  "/routeoptimize/ordersLastUpdated",
  orderCtrl.getOrdersLastUpdated
);
adminRouter.get(
  "/routeoptimize/checkordersrecentupdates",
  orderCtrl.getCheckOrdersRecentUpdates
);
adminRouter.post("/routeoptimize/createtour", tourCtrl.createTourController);
adminRouter.get("/routeoptimize/getTour", tourCtrl.getTourDetails);
adminRouter.get("/routeoptimize/getWarehouse/:id", getWarehouseById);
adminRouter.post("/routeoptimize/createtourHereApi", runTourController);

/* adminRouter.post(
  "/routeoptimize/dynamictourHereApi",
  validateToken,
  roleCheck(["admin"]),
  dynamicTourController
); */
/* adminRouter.post(
  "/routeoptimize/dynamictourHereApi",
  validateToken,
  roleCheck(["admin"]),
  dynamicTourController
); */
adminRouter.get("/routeoptimize/getAlltours", getAllTourController);
adminRouter.get("/routeoptimize/tourcount", tourCtrl.getTourcountcheck);
adminRouter.put("/routeoptimize/updateTour", tourCtrl.updateTourController);
adminRouter.delete("/routeoptimize/deleteTours", tourCtrl.deleteTourController);
adminRouter.post("/routeoptimize/exportTours", ExportTourController);
adminRouter.post(
  "/routeoptimize/getGraphhopperRoute",
  tourCtrl.getgraphhopperRoute
);
adminRouter.post("/routeoptimize/getSegmentRoute", tourCtrl.getSegmentRoutes);
adminRouter.post(
  "/routeoptimize/getRoutesSegmentImages",
  tourCtrl.getRoutesSegmentImages
);
adminRouter.put("/routeoptimize/updateCustomer", updateCustomerInfoController);
adminRouter.get("/orderDetails", orderCtrl.getOrderDetails);
adminRouter.get("/orderHistory", orderCtrl.getOrderHistoryDetails);
adminRouter.put("/orderStatus/:id", orderCtrl.updateOrderStatus);
adminRouter.post("/cancels");
adminRouter.get("/orderCount", getOrderCount);
adminRouter.get("/routeoptimize/gettourStatushistory", getAllTourhistory);
adminRouter.get("/routeoptimize/gettourStatus", tourCtrl.getTourstatus);
adminRouter.post(
  "/routeoptimize/updatetourstatus/:tourId",
  tourCtrl.updatetourstatus
);
adminRouter.post("/upload_image", uploadImageController);
adminRouter.post("/driver/tour/:tourId/order", HandleOrderDelivery);

adminRouter.get("/newShopwareOrder", shopware.newShopOrder);

adminRouter.use("/drivers", validateToken, roleCheck(["admin"]), driverRoutes);
adminRouter.use(
  "/cancels",
  validateToken,
  roleCheck(["admin", "drivers"]),
  cancelsRoutes
);
adminRouter.use(
  "/vehicles",
  validateToken,
  roleCheck(["admin"]),
  vehicleRoutes
);
adminRouter.use("/logs", fetchAppLogs);
adminRouter.use(
  "/warehouses",
  validateToken,
  roleCheck(["admin"]),
  warehouseRoutes
);
adminRouter.use(
  "/customers",
  validateToken,
  roleCheck(["admin"]),
  customerRoutes
);

adminRouter.use(notFoundHandler);

export default adminRouter;
