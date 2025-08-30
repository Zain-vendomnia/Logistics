import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  disableVehicle,
  disableMultipleVehicle
} from "../controller/Admin_Api/vehicleController";

const router = express.Router();

// 1) Auth for everything
router.use(validateToken);

// 2) Admin-only below this line
router.use(roleCheck(["admin"]));

// Vehicles CRUD + disable endpoints
router.get("/", getAllVehicles);                       
router.get("/:id", getVehicleById);                    
router.post("/", createVehicle);                       
router.put("/:id", updateVehicle);                    
router.patch("/:id/disable", disableVehicle);  
router.patch("/disable-multiple", disableMultipleVehicle);
export default router;
