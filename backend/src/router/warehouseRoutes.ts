import express from "express";
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  deleteMultipleWarehouses,
} from "../controller/Admin_Api/warehouseController";

const router = express.Router();

router.get("/warehouses", getAllWarehouses);
router.get("/warehouses/:id", getWarehouseById);
router.post("/warehouses", createWarehouse);
router.put("/warehouses/:id", updateWarehouse);
router.delete("/warehouses/:id", deleteWarehouse);
router.post("/warehouses/delete-multiple", deleteMultipleWarehouses); // Bulk delete

export default router;
