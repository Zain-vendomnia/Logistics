import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  disableWarehouse,
  disableMultipleWarehouses,
} from "../controller/Admin_Api/warehouseController";

const router = express.Router();

// Apply middleware to all warehouse routes
router.use(validateToken, roleCheck(["admin"]));

router.get("/", getAllWarehouses);
router.get("/:id", getWarehouseById);
router.post("/", createWarehouse);
router.put("/:id", updateWarehouse);
router.patch("/:id/disable", disableWarehouse);  
router.patch("/disable-multiple", disableMultipleWarehouses);

export default router;