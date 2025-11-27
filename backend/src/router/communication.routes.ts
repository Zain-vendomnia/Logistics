import express from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";
import {
  getConversation,
  sendMessage,
} from "../controller/communicationController";

const router = express.Router();

// Apply authentication globally
router.use(validateToken);

// Everything below is admin-only
router.use(roleCheck(["admin"]));

// Communication routes
router.get("/:orderId", getConversation);
router.post("/send", sendMessage);

export default router;