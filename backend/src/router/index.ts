import { Router } from "express";
import authRouter from "./auth.routes";
import adminRouter from "./admin.routes";
import driverRoutes from "./driver.routes";
import warehouseRoutes from "./warehouse.routes";
import { scheduleWmsOrderController } from "../controller/Admin_Api/scheduleWmsOrderInfo.controller";
import { uploadImageController } from "../controller/Admin_Api/uploadImage.controller";
import { getOrderCount } from "../controller/Admin_Api/orderCount.controller";
import { HandleOrderDelivery } from "../controller/AdminDriverApi/HandleOrderDelivery";

const router = Router();

// router.use("/api", authRouter);
// router.use("/test", authRouter);

router.use("/auth", authRouter);
router.use("/admin", adminRouter);

router.use("/admin/drivers", driverRoutes);
// router.use("/admin/", driverRoutes);
router.use("/admin/warehouses", warehouseRoutes);
// router.use("/admin/", warehouseRoutes);

// Standalone admin API endpoints
router.get("/admin/orderCount", getOrderCount);
router.get("/admin/scheduleWmsOrderInfo", scheduleWmsOrderController);
router.post("/upload_image", uploadImageController);
router.use("/admindriver/tour/:tourId/order", HandleOrderDelivery);

export default router;

// Picklist Email Route
// app.post("/api/admin/picklistEmail", picklistEmail); // This will handle POST requests to send the email
// app.post("/api/admin/insertParkingPermit", insertParkingPermit); // This will handle POST requests to insert the parking permit form
