import express from "express";
import validateToken from "./validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  deleteMultipleWarehouses,
} from "../controller/Admin_Api/warehouseController";

const router = express.Router();

// Apply middleware to all warehouse routes
router.use(validateToken, roleCheck(["admin"]));

router.get("/", getAllWarehouses);
router.get("/:id", getWarehouseById);
router.post("/", createWarehouse);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);
router.post("/delete-multiple", deleteMultipleWarehouses);

export default router;
