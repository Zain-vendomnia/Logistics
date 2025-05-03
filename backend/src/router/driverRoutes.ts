import express from "express";
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  deleteMultipleDrivers,
} from "../controller/Admin_Api/driverController";

const router = express.Router();

router.get("/drivers", getAllDrivers);
router.get("/drivers/:id", getDriverById);
router.post("/drivers", createDriver);
router.put("/drivers/:id", updateDriver);
router.delete("/drivers/:id", deleteDriver);
router.post("/drivers/delete-multiple", deleteMultipleDrivers); // Bulk delete

export default router;
