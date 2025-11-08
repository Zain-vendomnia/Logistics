import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllCancels,
  createCancel,
  updateCancel,
  deleteCancel,
  deleteAllCancels
} from "../controller/Admin_Api/cancelController";

const router = express.Router();

// ✅ 1) Apply only auth globally
router.use(validateToken);

// ✅ 2) Admin + Driver can view cancel data (if needed)
router.get("/", roleCheck(["admin", "driver"]), getAllCancels);

// ✅ 3) Admin-only routes for management
router.use(roleCheck(["admin"]));

// ➕ Create new cancel
router.post("/create", createCancel);

// ✏️ Update a specific cancel by ID
router.put("/update/:id", updateCancel);

// ❌ Delete a specific cancel by ID
router.delete("/delete/:id", deleteCancel);

// ⚠️ Delete all cancels (use carefully)
router.delete("/delete-all", deleteAllCancels);

export default router;