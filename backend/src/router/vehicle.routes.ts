import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle
} from "../controller/Admin_Api/vehicleController";

const router = express.Router();

// 1) Auth for everything
router.use(validateToken);

// 2) Admin-only below this line
router.use(roleCheck(["admin"]));

// Vehicles CRUD + disable endpoints
router.get("/", getAllVehicles);                       // Get all vehicles
router.get("/:id", getVehicleById);                    // Get one vehicle by ID
router.post("/", createVehicle);                       // Create vehicle
router.put("/:id", updateVehicle);                     // Update vehicle

export default router;
