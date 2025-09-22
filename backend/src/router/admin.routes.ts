import { Router } from "express";
import roleCheck from "../middlewares/roleCheck";
import validateToken from "../middlewares/validateToken";

// Import controllers
import { optimizeRouteController } from "../controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "../controller/Admin_RouteOptimzation/updatelatlngController";
import * as OrderCtrl from "../controller/Admin_RouteOptimzation/order.controller";
import * as TourCtrl from "../controller/Admin_RouteOptimzation/tour.controller";
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

import { HandleOrderDelivery } from "../controller/AdminDriverApi/HandleOrderDelivery";
import { getFilteredToursController } from "../controller/tourManagement.controller";
import { runTourController } from "../controller/HERE_API/runTourController";
import { hereMapController } from "../controller/HERE_API/hereMapController";

import driverRoutes from "./driver.routes";
import customerRoutes from "./customers.routes";
import messagesRoutes from "./messages.routes";
import vehicleRoutes from "./vehicle.routes";
import warehouseRoutes from "./warehouse.routes";
import * as dynamicTourCtrl from "../controller/HERE_API/dynamicTour.controller";

import { upload } from "../middlewares/upload";
import { parseExcelToJobs } from "../utils/parseExcel";

import { notFoundHandler } from "../middlewares/notFoundHandler";
import * as shopware from "../controller/AdminDriverApi/shopwareOrderController";

import { orderSyncFromShopwareController } from "../controller/Admin_Api/orderSync.controller";
import { shopwareAuth } from "../middlewares/shopwareAuth";

const adminRouter = Router();
adminRouter.use("/messages", messagesRoutes);

// Public routes (no authentication required)
adminRouter.get("/customer/updatelatlng", updatelatlngController);
adminRouter.post("/sendEmail", sendEmail);
adminRouter.post("/routeoptimize/getOrder", OrderCtrl.getAllLogisticOrders);
// adminRouter.post("/picklistEmail", picklistEmail);
adminRouter.get("/routeoptimize/getOrder", OrderCtrl.getLgsticOrderById);
adminRouter.get("/routeoptimize/ordersWithItems", OrderCtrl.getOrdersWithItems);
adminRouter.post("/insertParkingPermit", insertParkingPermit);
adminRouter.post("/getOrderNotificationMetaData", getOrderNotificationMetaData);
adminRouter.post(
  "/updateOrderNotificationMetaData",
  updateOrderNotificationMetaData
);
adminRouter.post("/Runtour", runTourController);

adminRouter.post("/uploadexcel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }
    //console.log("testing");
    const jobList = parseExcelToJobs(req.file.path);

    // Pass jobList to the controller
    await dynamicTourCtrl.create_dynamicTour(req, res, jobList);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to process uploaded Excel.",
      error: (err as Error).message,
    });
  }
});

adminRouter.post("/order-sync", shopwareAuth, orderSyncFromShopwareController);

// Protected routes (each one applies validateToken + roleCheck)
adminRouter.use(validateToken, roleCheck(["admin"]));

adminRouter.post("/hereMapController", hereMapController);
// adminRouter.post("/dynamicTourController", dynamicTourCtrl.create_dynamicTour);

adminRouter.get("/dynamicTours", dynamicTourCtrl.getDynamicTours);
adminRouter.post("/createDynamicTour", dynamicTourCtrl.createDynamicTour);
adminRouter.post("/acceptDynamicTour", dynamicTourCtrl.acceptDynamicTour);
adminRouter.post("/rejectDynamicTour", dynamicTourCtrl.rejectDynamicTour);

adminRouter.get("/pinboardOrders", OrderCtrl.getPinboardOrders);
adminRouter.get("/tours", getFilteredToursController);

adminRouter.get("/route/routeoptimize/optimize", optimizeRouteController);

adminRouter.get("/routeoptimize/orders", OrderCtrl.getAllLogisticOrders);

adminRouter.get("/routeoptimize/ordercount", OrderCtrl.getcountcheck);

adminRouter.get(
  "/routeoptimize/ordersLastUpdated",
  OrderCtrl.getOrdersLastUpdated
);
adminRouter.get(
  "/routeoptimize/checkordersrecentupdates",
  OrderCtrl.getCheckOrdersRecentUpdates
);
adminRouter.post("/routeoptimize/createtour", TourCtrl.createTourController);
adminRouter.get("/routeoptimize/getTour", TourCtrl.getTourDetails);
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
adminRouter.get("/routeoptimize/tourcount", TourCtrl.getTourcountcheck);
adminRouter.put("/routeoptimize/updateTour", TourCtrl.updateTourController);
adminRouter.delete("/routeoptimize/deleteTours", TourCtrl.deleteTourController);
adminRouter.post("/routeoptimize/exportTours", ExportTourController);
adminRouter.post(
  "/routeoptimize/getGraphhopperRoute",
  TourCtrl.getgraphhopperRoute
);
adminRouter.get("/routeoptimize/getSegmentRoute", TourCtrl.getSegmentRoutes);
adminRouter.put("/routeoptimize/updateCustomer", updateCustomerInfoController);
adminRouter.get("/orderCount", getOrderCount);
adminRouter.get("/routeoptimize/gettourStatushistory", getAllTourhistory);
adminRouter.get("/routeoptimize/gettourStatus", TourCtrl.getTourstatus);
adminRouter.post(
  "/routeoptimize/updatetourstatus/:tourId",
  TourCtrl.updatetourstatus
);
adminRouter.post("/upload_image", uploadImageController);
adminRouter.post("/driver/tour/:tourId/order", HandleOrderDelivery);

adminRouter.get("/newShopwareOrder", shopware.newShopOrder);

adminRouter.use("/drivers", validateToken, roleCheck(["admin"]), driverRoutes);
adminRouter.use(
  "/vehicles",
  validateToken,
  roleCheck(["admin"]),
  vehicleRoutes
);
adminRouter.use("/warehouses", warehouseRoutes);
adminRouter.use("/customers", validateToken, roleCheck(["admin"]), customerRoutes);

adminRouter.use(notFoundHandler);

export default adminRouter;
