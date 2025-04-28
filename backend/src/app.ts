import express from "express";
import cors from 'cors';
import morgan from "morgan";
import authRouter from "./router/auth.routes";
// import userRouter from "./router/auth.routes";
import config from "./config";
import { fetchScheduleOrderInfo,fetchScheduleWmsOrderInfo } from './services/scheduleFetching';

// Import the controller fucntion for the order info
import { orderInfoController } from "./controller/Admin_Api/orderInfo.controller";
import { scheduleOrderInfoController } from "./controller/Admin_Api/scheduleOrderInfo.controller";
import { scheduleWmsOrderController } from "./controller/Admin_Api/scheduleWmsOrderInfo.controller";

// import { addData,getImageById } from "./controller/Admin_Api/route_segments.controller";
import { uploadImageController } from "./controller/Admin_Api/uploadImage.controller";


import { GeocodingController } from "./controller/Admin_RouteOptimzation/geocodingController";
import { optimizeRouteController } from "./controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "./controller/Admin_RouteOptimzation/updatelatlngController";
import {  getAllLogisticOrders, getcountcheck } from './controller/Admin_RouteOptimzation/order.controller';
import { createTourController, getTourcountcheck,updateTourController, deleteTourController } from './controller/Admin_RouteOptimzation/tourController';
import { ExportTourController } from './controller/Admin_RouteOptimzation/exportTourController';
import { getAllTourController } from "./controller/Admin_RouteOptimzation/getAllTourController";


// import { getImageById } from "./controller/Admin_Api/route_segments.controller";

const app = express();
app.use(cors());

app.set("port", config.PORT);
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(express.json({ limit: '50mb' })); // Increase limit if sending large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Define the root route to prevent "Cannot GET /"
app.get('/', (_req, res) => {
  res.send("Welcome to the API!"); 
});

// Router
app.use("/api/auth", authRouter);
app.use("/api", authRouter);  
app.use("/api/test", authRouter);
  
// app.use("/api", userRouter);  
// app.use("/api/test", userRouter);  
app.use('/api/admin/geocode', GeocodingController.getLatLng);
app.use('/api/admin/route/routeoptimize/optimize', optimizeRouteController);
app.use('/api/admin/customer/updatelatlng', updatelatlngController);
app.use('/api/admin/routeoptimize/orders', getAllLogisticOrders);
app.use('/api/admin/routeoptimize/ordercount', getcountcheck);
app.use('/api/admin/routeoptimize/createtour', createTourController);
app.use('/api/admin/routeoptimize/getAlltours', getAllTourController);
app.use('/api/admin/routeoptimize/tourcount', getTourcountcheck);
// --------------------------------------------------------------------
app.use('/api/admin/routeoptimize/updateTour', updateTourController);
app.use('/api/admin/routeoptimize/deleteTours', deleteTourController);
app.use('/api/admin/routeoptimize/exportTours', ExportTourController);

// --------------------------------------------------------------------
app.get("/api/admin/orderinfo", orderInfoController);
app.get("/api/admin/scheduleOrderInfo", scheduleOrderInfoController);
app.get("/api/admin/scheduleWmsOrderInfo", scheduleWmsOrderController);


app.post("/upload_image", uploadImageController);

// app.post("/route_segments/addData",addData);

// app.get("/route_segments/:id/image", getImageById);

// Catch-all 404 Handler (keep this LAST)
app.use((req, res) => {
  res.status(404).json({
    message: `Oops! Route [${req.method}] ${req.originalUrl} not found on this server.`,
    suggestion: "Check your URL or method type (GET, POST, etc.)"
  });
});

fetchScheduleOrderInfo();
fetchScheduleWmsOrderInfo();

export default app;
