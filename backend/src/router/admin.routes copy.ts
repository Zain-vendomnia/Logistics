import { Router } from "express";
import validateToken from "./validateToken";
import roleCheck from "../middlewares/roleCheck";

// Import controllers
// import { GeocodingController } from "../controller/Admin_RouteOptimzation/geocodingController";
import { optimizeRouteController } from "../controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "../controller/Admin_RouteOptimzation/updatelatlngController";
import { getAllLogisticOrders,getAllLogisticOrder, getcountcheck } from '../controller/Admin_RouteOptimzation/order.controller';
import {
  createTourController, getTourcountcheck, updateTourController,
  deleteTourController, getgraphhopperRoute, getSegmentRoutes, getTourstatus,updatetourstatus
} from '../controller/Admin_RouteOptimzation/tourController';
import { ExportTourController } from '../controller/Admin_RouteOptimzation/exportTourController';
import { getAllTourController } from "../controller/Admin_RouteOptimzation/getAllTourController";
import { getOrderCount } from "../controller/Admin_Api/orderCount.controller";
import { orderInfoController } from "../controller/Admin_Api/orderInfo.controller";
import { scheduleOrderInfoController } from "../controller/Admin_Api/scheduleOrderInfo.controller";
import { scheduleWmsOrderController } from "../controller/Admin_Api/scheduleWmsOrderInfo.controller";
import { uploadImageController } from "../controller/Admin_Api/uploadImage.controller";
import { HandleOrderDelivery } from "../controller/AdminDriverApi/HandleOrderDelivery";
import { picklistEmail } from '../controller/Admin_Api/picklistEmail.controller'; // Import the controller
// import { insertParkingPermit } from '../controller/Admin_Api/insertParkingPermit.controller'; 
import { getFilteredToursController } from "../controller/tourManagement.controller";
import { updateCustomerInfoController } from "../controller/Admin_RouteOptimzation/updateCustomerInfo.controller";

//  driver routes
import driverRoutes from "./driverRoutes";

//  warehouse routes
import warehouseRoutes from "./warehouseRoutes";
import { getAllTourhistory } from "../controller/Admin_RouteOptimzation/getAllTourhistory";

// Create router
const adminRouter = Router();

// Remove restrictions from these routes (make them public):
adminRouter.get('/customer/updatelatlng', updatelatlngController);
adminRouter.get("/orderinfo", orderInfoController);
adminRouter.get("/scheduleOrderInfo", scheduleOrderInfoController);
adminRouter.get("/scheduleWmsOrderInfo", scheduleWmsOrderController);
adminRouter.get('/customer/updatelatlng', updatelatlngController);
adminRouter.post('/routeoptimize/getOrder', getAllLogisticOrder);
adminRouter.post("/picklistEmail", picklistEmail); 
// adminRouter.post("/insertParkingPermit", insertParkingPermit); 
// adminRouter.get('/geocode', GeocodingController.getLatLng);

// Apply token & role check to all routes EXCEPT the ones we want to make public
adminRouter.use(validateToken, roleCheck(["admin"]));

// Define routes with restrictions
adminRouter.get("/tours", getFilteredToursController);
adminRouter.get('/route/routeoptimize/optimize', optimizeRouteController);
adminRouter.get('/routeoptimize/orders', getAllLogisticOrders);
adminRouter.get('/routeoptimize/ordercount', getcountcheck);
adminRouter.post('/routeoptimize/createtour', createTourController);
adminRouter.get('/routeoptimize/getAlltours', getAllTourController);
adminRouter.get('/routeoptimize/tourcount', getTourcountcheck);
adminRouter.put('/routeoptimize/updateTour', updateTourController);
adminRouter.delete('/routeoptimize/deleteTours', deleteTourController);
adminRouter.post('/routeoptimize/exportTours', ExportTourController);
adminRouter.post('/routeoptimize/getGraphhopperRoute', getgraphhopperRoute);
adminRouter.get('/routeoptimize/getSegmentRoute', getSegmentRoutes);
adminRouter.put('/routeoptimize/updateCustomer', updateCustomerInfoController);
adminRouter.get("/orderCount", getOrderCount);
adminRouter.get('/routeoptimize/gettourStatushistory', getAllTourhistory);
adminRouter.get('/routeoptimize/gettourStatus', getTourstatus);
adminRouter.post('/routeoptimize/updatetourstatus/:tourId', updatetourstatus);

// Keep the other routes under restriction:
adminRouter.post("/upload_image", uploadImageController);
adminRouter.post("/driver/tour/:tourId/order", HandleOrderDelivery);

// ------------------ drivers routes ------------------
adminRouter.use("/drivers", driverRoutes);

// ------------------ warehouse routes ------------------
adminRouter.use("/warehouses", warehouseRoutes);

export default adminRouter;
