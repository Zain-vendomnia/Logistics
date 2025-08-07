import { Router } from "express";
import validateToken from "./validateToken";
import roleCheck from "../middlewares/roleCheck";

// Import controllers
import { optimizeRouteController } from "../controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "../controller/Admin_RouteOptimzation/updatelatlngController";
import {
  getAllLogisticOrders,
  getAllLogisticOrder,
  getcountcheck,
  getOrdersLastUpdated,
  getCheckOrdersRecentUpdates,
  getPinboardOrders,
} from "../controller/Admin_RouteOptimzation/order.controller";
import {
  createTourController,
  getTourcountcheck,
  updateTourController,
  deleteTourController,
  getgraphhopperRoute,
  getSegmentRoutes,
  getTourstatus,
  updatetourstatus,
  getTourDetails,
} from "../controller/Admin_RouteOptimzation/tourController";
import { ExportTourController } from "../controller/Admin_RouteOptimzation/exportTourController";
import { getAllTourController } from "../controller/Admin_RouteOptimzation/getAllTourController";

import { getOrderCount } from "../controller/Admin_Api/orderCount.controller";
import { scheduleWmsOrderController } from "../controller/Admin_Api/scheduleWmsOrderInfo.controller";
import { uploadImageController } from "../controller/Admin_Api/uploadImage.controller";
import { HandleOrderDelivery } from "../controller/AdminDriverApi/HandleOrderDelivery";
import { picklistEmail } from "../controller/Admin_Api/picklistEmail.controller";

import { getFilteredToursController } from "../controller/tourManagement.controller";
import { updateCustomerInfoController } from "../controller/Admin_RouteOptimzation/updateCustomerInfo.controller";
import { getAllTourhistory } from "../controller/Admin_RouteOptimzation/getAllTourhistory";
import { insertParkingPermit } from "../controller/Admin_Api/insertParkingPermit.controller";
import { runTourController } from "../controller/HERE_API/runTourController";

import driverRoutes from "./driverRoutes";
import warehouseRoutes from "./warehouseRoutes";
import {
  create_dynamicTour,
  getDynamicTours,
} from "../controller/HERE_API/dynamicTour.controller";

import { upload } from "../middlewares/upload";
import { parseExcelToJobs } from "../utils/parseExcel";
import { hereMapController } from "../controller/HERE_API/hereMapController";
import { getWarehouseById } from "../controller/Admin_Api/warehouseController";

const adminRouter = Router();

/**
 * Public routes (no authentication required)
 */
adminRouter.get("/customer/updatelatlng", updatelatlngController);
adminRouter.get("/scheduleWmsOrderInfo", scheduleWmsOrderController);
adminRouter.post("/picklistEmail", picklistEmail);
adminRouter.post("/routeoptimize/getOrder", getAllLogisticOrder);
adminRouter.post("/insertParkingPermit", insertParkingPermit);
adminRouter.post("/Runtour", runTourController);

adminRouter.post("/uploadexcel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }
    //console.log("testing");
    const jobList = parseExcelToJobs(req.file.path);

    // Pass jobList to the controller
    await create_dynamicTour(req, res, jobList);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to process uploaded Excel.",
      error: (err as Error).message,
    });
  }
});

/**
 * Protected routes (each one applies validateToken + roleCheck)
 */
adminRouter.post(
  "/hereMapController",
  validateToken,
  roleCheck(["admin"]),
  hereMapController
);
adminRouter.post(
  "/dynamicTourController",
  validateToken,
  roleCheck(["admin"]),
  hereMapController
);
adminRouter.get(
  "/pinboardOrders",
  validateToken,
  roleCheck(["admin"]),
  getPinboardOrders
);
adminRouter.get(
  "/dynamicTours",
  validateToken,
  roleCheck(["admin"]),
  getDynamicTours
);
adminRouter.get(
  "/tours",
  validateToken,
  roleCheck(["admin"]),
  getFilteredToursController
);

adminRouter.get(
  "/route/routeoptimize/optimize",
  validateToken,
  roleCheck(["admin"]),
  optimizeRouteController
);

adminRouter.get(
  "/routeoptimize/orders",
  validateToken,
  roleCheck(["admin"]),
  getAllLogisticOrders
);

adminRouter.get(
  "/routeoptimize/ordercount",
  validateToken,
  roleCheck(["admin"]),
  getcountcheck
);

adminRouter.get(
  "/routeoptimize/ordersLastUpdated",
  validateToken,
  roleCheck(["admin"]),
  getOrdersLastUpdated
);

adminRouter.get(
  "/routeoptimize/checkordersrecentupdates",
  validateToken,
  roleCheck(["admin"]),
  getCheckOrdersRecentUpdates
);

adminRouter.post(
  "/routeoptimize/createtour",
  validateToken,
  roleCheck(["admin"]),
  createTourController
);
adminRouter.get(
  "/routeoptimize/getTour",
  validateToken,
  roleCheck(["admin"]),
  getTourDetails
);
adminRouter.get(
  "/routeoptimize/getWarehouse/:id",
  validateToken,
  roleCheck(["admin"]),
  getWarehouseById
);
adminRouter.post(
  "/routeoptimize/createtourHereApi",
  validateToken,
  roleCheck(["admin"]),
  runTourController
);

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

adminRouter.get(
  "/routeoptimize/getAlltours",
  validateToken,
  roleCheck(["admin"]),
  getAllTourController
);

adminRouter.get(
  "/routeoptimize/tourcount",
  validateToken,
  roleCheck(["admin"]),
  getTourcountcheck
);

adminRouter.put(
  "/routeoptimize/updateTour",
  validateToken,
  roleCheck(["admin"]),
  updateTourController
);

adminRouter.delete(
  "/routeoptimize/deleteTours",
  validateToken,
  roleCheck(["admin"]),
  deleteTourController
);

adminRouter.post(
  "/routeoptimize/exportTours",
  validateToken,
  roleCheck(["admin"]),
  ExportTourController
);

adminRouter.post(
  "/routeoptimize/getGraphhopperRoute",
  validateToken,
  roleCheck(["admin"]),
  getgraphhopperRoute
);

adminRouter.get(
  "/routeoptimize/getSegmentRoute",
  validateToken,
  roleCheck(["admin"]),
  getSegmentRoutes
);

adminRouter.put(
  "/routeoptimize/updateCustomer",
  validateToken,
  roleCheck(["admin"]),
  updateCustomerInfoController
);

adminRouter.get(
  "/orderCount",
  validateToken,
  roleCheck(["admin"]),
  getOrderCount
);

adminRouter.get(
  "/routeoptimize/gettourStatushistory",
  validateToken,
  roleCheck(["admin"]),
  getAllTourhistory
);

adminRouter.get(
  "/routeoptimize/gettourStatus",
  validateToken,
  roleCheck(["admin"]),
  getTourstatus
);

adminRouter.post(
  "/routeoptimize/updatetourstatus/:tourId",
  validateToken,
  roleCheck(["admin"]),
  updatetourstatus
);

adminRouter.post(
  "/upload_image",
  validateToken,
  roleCheck(["admin"]),
  uploadImageController
);

adminRouter.post(
  "/driver/tour/:tourId/order",
  validateToken,
  roleCheck(["admin"]),
  HandleOrderDelivery
);

adminRouter.use("/drivers", validateToken, roleCheck(["admin"]), driverRoutes);
adminRouter.use(
  "/warehouses",
  validateToken,
  roleCheck(["admin"]),
  warehouseRoutes
);

/**
 * Catch‐all 404 for any undefined /api/admin/* route
 */
adminRouter.use((req, res) => {
  res.status(404).json({
    message: `Route [${req.method}] ${req.originalUrl} not found under /api/admin`,
  });
});

export default adminRouter;
