import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllCancelOrders,
  getCancelOrderItems,
  searchCancelOrder,
  createCancelOrder,
  updateCancel,
  deleteCancel,
  deleteAllCancels,
} from "../controller/Admin_Api/cancelController";

const router = express.Router();

// Apply auth globally
router.use(validateToken);

// Admin + Driver can view cancel data
router.get("/orders", roleCheck(["admin", "driver"]), getAllCancelOrders);
router.get(
  "/orders/:orderNumber/items",
  roleCheck(["admin", "driver"]),
  getCancelOrderItems
);

// Search cancel orders by order number (Admin + Driver)
router.get("/search", roleCheck(["admin", "driver"]), searchCancelOrder);

// Admin-only routes
router.use(roleCheck(["admin"]));

// Create new cancel
router.post("/create", createCancelOrder);

// Update cancel item
router.put("/update/:id", updateCancel);

// Delete cancel item
router.delete("/delete/:id", deleteCancel);

// Delete all cancels
router.delete("/delete-all", deleteAllCancels);

export default router;
