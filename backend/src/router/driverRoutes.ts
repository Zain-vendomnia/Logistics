import express from "express";
import validateToken from "./validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  deleteMultipleDrivers,
  checkDriverEligibility,
  getAvailableDriversByDateAndWarehouse 
} from "../controller/Admin_Api/driverController";

const router = express.Router();

// Apply middleware to all driver routes
router.use(validateToken, roleCheck(["admin"]));

router.get("/", getAllDrivers);
router.get("/available", getAvailableDriversByDateAndWarehouse);
router.get("/:id", getDriverById);
router.post("/", createDriver);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);
router.post("/delete-multiple", deleteMultipleDrivers);

router.get("/check-eligibility/:driverId", checkDriverEligibility);


export default router;
