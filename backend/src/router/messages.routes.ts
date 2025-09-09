import express from "express";
// import validateToken from "../middlewares/validateToken";
// import roleCheck from "../middlewares/roleCheck";
import { 
  updateUnreadCount,
  getMessagesByOrderId,
  sendMessage,
  // New webhook controllers
  handleTwilioStatusWebhook,
  handleTwilioIncomingWebhook,
  testWebhookEndpoint
} from "../controller/Admin_Api/messagesController";
import { notFoundHandler } from "../middlewares/notFoundHandler";

const router = express.Router();

// ✅ WEBHOOK ROUTES (NO AUTH) - Must be BEFORE authentication middleware
// These endpoints are called by Twilio, so they don't need authentication
router.use('/twilio', express.urlencoded({ extended: true })); // Parse Twilio form data
router.use('/twilio', express.json()); // Also handle JSON

// Twilio webhook endpoints (public - no auth required)
router.post("/twilio/status", handleTwilioStatusWebhook);     // Status updates from Twilio
router.post("/twilio/incoming", handleTwilioIncomingWebhook); // Incoming WhatsApp messages  
router.get("/twilio/test", testWebhookEndpoint);              // Test webhook setup

// ✅ AUTHENTICATED ROUTES - Apply authentication after webhook routes
// router.use(validateToken);

// Everything below is admin-only
// router.use(roleCheck(["admin"]));

// ✅ ADMIN MESSAGE MANAGEMENT ROUTES
router.get("/:orderId", getMessagesByOrderId);           // GET /api/admin/messages/:orderId
router.post("/:orderId", sendMessage);                   // POST /api/admin/messages/:orderId  
router.put("/:orderId/unread-count", updateUnreadCount); // PUT /api/admin/messages/:orderId/unread-count
router.use(notFoundHandler);
export default router;