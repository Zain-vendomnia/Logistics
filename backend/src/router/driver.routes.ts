import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import { upload } from "../middlewares/multer";
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  disableDriver,
  disableMultipleDrivers,
  checkDriverEligibility,
  getAvailableDriversByDateAndWarehouse,
  getDriverPerformanceData,
  weeklyDriverPerformanceData,
  startTrip
} from "../controller/Admin_Api/driverController";

const router = express.Router();

// 1) Apply only auth globally
router.use(validateToken);

// 2) Performance route: allow admin + driver
router.post("/start-trip",roleCheck(["admin", "driver"]),  upload.array("images"),startTrip);


router.get("/performance", roleCheck(["admin", "driver"]), getDriverPerformanceData);
router.get("/week-performance", roleCheck(["admin", "driver"]), weeklyDriverPerformanceData);

// 3) Everything below is admin-only
router.use(roleCheck(["admin"]));

router.get("/", getAllDrivers);
router.get("/available", getAvailableDriversByDateAndWarehouse);
router.get("/:id", getDriverById);
router.post("/", createDriver);
router.put("/:id", updateDriver);
router.patch("/:id/disable", disableDriver);
router.patch("/disable-multiple", disableMultipleDrivers);
router.get("/check-eligibility/:driverId", checkDriverEligibility);

export default router;


