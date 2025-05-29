import express from "express";
import cors from 'cors';
import morgan from "morgan";
import authRouter from "./router/auth.routes";
import adminRouter from "./router/admin.routes";
// import userRouter from "./router/auth.routes";
import config from "./config";
import { setupSwagger } from './swagger';

// Import the controller fucntion for the order info
import { orderInfoController } from "./controller/Admin_Api/orderInfo.controller";
import { scheduleOrderInfoController } from "./controller/Admin_Api/scheduleOrderInfo.controller";
import { scheduleWmsOrderController } from "./controller/Admin_Api/scheduleWmsOrderInfo.controller";

// import { addData,getImageById } from "./controller/Admin_Api/route_segments.controller";
import { uploadImageController } from "./controller/Admin_Api/uploadImage.controller";


// Picklist Email
import { picklistEmail } from './controller/Admin_Api/picklistEmail.controller'; // Import the controller

// Parking Permit 
import { insertParkingPermit } from './controller/Admin_Api/insertParkingPermit.controller'; // Import the controller

// total orders count controller 
import { getOrderCount } from "./controller/Admin_Api/orderCount.controller";

//  driver routes
import driverRoutes from "./router/driverRoutes";

//  warehouse routes
import warehouseRoutes from "./router/warehouseRoutes";
import { HandleOrderDelivery } from "./controller/AdminDriverApi/HandleOrderDelivery";

// import { getImageById } from "./controller/Admin_Api/route_segments.controller";

const app = express();
app.use(cors());

app.set("port", config.PORT);
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(express.json({ limit: '50mb' })); // Increase limit if sending large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Swagger setup
setupSwagger(app);

// Define the root route to prevent "Cannot GET /"
app.get('/', (_req, res) => {
  res.send("Welcome to the API!"); 
});

// Router
app.use("/api/auth", authRouter);
app.use("/api", authRouter);  
app.use("/api/test", authRouter);
  
app.use("/api/admin", adminRouter);

// --------------------------------------------------------------------
// total order count
app.get("/api/admin/orderCount", getOrderCount);
// --------------------------------------------------------------------
app.get("/api/admin/orderinfo", orderInfoController);
app.get("/api/admin/scheduleOrderInfo", scheduleOrderInfoController);
app.get("/api/admin/scheduleWmsOrderInfo", scheduleWmsOrderController);

app.post("/upload_image", uploadImageController);
// ------------------ drivers routes ------------------
app.use("/api/admin/", driverRoutes);
// ------------------ warehouse routes ------------------
app.use("/api/admin/", warehouseRoutes);
// Picklist Email Route
app.post("/api/admin/picklistEmail", picklistEmail); // This will handle POST requests to send the email
app.post("/api/admin/insertParkingPermit", insertParkingPermit); // This will handle POST requests to insert the parking permit form

app.use('/api/admindriver/tour/:tourId/order', HandleOrderDelivery);

// app.post("/route_segments/addData",addData);

// app.get("/route_segments/:id/image", getImageById);

// Catch-all 404 Handler (keep this LAST)
app.use((req, res) => {
  res.status(404).json({
    message: `Oops! Route [${req.method}] ${req.originalUrl} not found on this server.`,
    suggestion: "Check your URL or method type (GET, POST, etc.)"
  });
});




export default app;
