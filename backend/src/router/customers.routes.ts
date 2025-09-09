import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {getAllCustomers} from "../controller/Admin_Api/customersController";

const router = express.Router();

// Apply authentication globally
router.use(validateToken);

// Everything below is admin-only
router.use(roleCheck(["admin"]));

// Customer routes
router.get("/", getAllCustomers);

export default router;