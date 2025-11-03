import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getAllReturns,
  createReturn,
  updateReturn,
  deleteReturn,
  deleteAllReturns
} from "../controller/Admin_Api/returnController";

const router = express.Router();

// ✅ 1) Apply only auth globally
router.use(validateToken);

// ✅ 2) Admin + Driver can view return data (if needed)
router.get("/", roleCheck(["admin", "driver"]), getAllReturns);

// ✅ 3) Admin-only routes for management
router.use(roleCheck(["admin"]));

// ➕ Create new return
router.post("/create", createReturn);

// ✏️ Update a specific return by ID
router.put("/update/:id", updateReturn);

// ❌ Delete a specific return by ID
router.delete("/delete/:id", deleteReturn);

// ⚠️ Delete all returns (use carefully)
router.delete("/delete-all", deleteAllReturns);

export default router;
