import express from "express";
import cors from 'cors';
import morgan from "morgan";
import authRouter from "./router/auth.routes";
import userRouter from "./router/auth.routes";
import config from "./config";
import { fetchScheduleOrderInfo } from './services/scheduleFetching';
import { upload } from "./config/multer";

// Import the controller fucntion for the order info
import { orderInfoController } from "./controller/Admin_Api/orderInfo.controller";
import { scheduleOrderInfoController } from "./controller/Admin_Api/scheduleOrderInfo.controller";

import { addData } from "./controller/customer/route_segments.controller";

import { GeocodingController } from "./controller/Admin_RouteOptimzation/geocodingController";
import { optimizeRouteController } from "./controller/Admin_RouteOptimzation/optimizeRouteController";
import { updatelatlngController } from "./controller/Admin_RouteOptimzation/updatelatlngController";

const app = express();
app.use(cors());

app.set("port", config.PORT);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// Define the root route to prevent "Cannot GET /"
app.get('/', (_req, res) => {
  res.send("Welcome to the API!"); 
});

// Router
app.use("/api/auth", authRouter);
app.use("/api", userRouter);  
app.use("/api/test", userRouter);  
app.use('/api/admin/geocode', GeocodingController.getLatLng);
app.use('/api/admin/route/optimize', optimizeRouteController);
app.use('/api/admin/customer/updatelatlng', updatelatlngController);


// Directly link the controller (no router file)
app.get("/api/admin/orderinfo", orderInfoController);
app.get("/api/admin/scheduleOrderInfo", scheduleOrderInfoController);
// Routes
app.post("/route_segments/addData", upload.single("image"), addData);

// Catch-all 404 Handler (keep this LAST)
app.use((req, res) => {
  res.status(404).json({
    message: `Oops! Route [${req.method}] ${req.originalUrl} not found on this server.`,
    suggestion: "Check your URL or method type (GET, POST, etc.)"
  });
});


// You can now use the fetchScheduleOrderInfo function in this file
fetchScheduleOrderInfo();


export default app;
