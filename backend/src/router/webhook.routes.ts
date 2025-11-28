import express from "express";
import multer from "multer";
import {
  handleWhatsAppWebhook,
  handleSMSWebhook,
  handleStatusWebhook,
  handleInboundEmail,
} from "../controller/webhookController";

const router = express.Router();

// Multer for parsing multipart/form-data (SendGrid Inbound Parse)
const upload = multer();

/**
 * Twilio WhatsApp Webhook
 * POST /api/webhooks/twilio/whatsapp
 */
router.post("/twilio/whatsapp", handleWhatsAppWebhook);

/**
 * Twilio SMS Webhook
 * POST /api/webhooks/twilio/sms
 */
router.post("/twilio/sms", handleSMSWebhook);

/**
 * Twilio Status Webhook
 * POST /api/webhooks/twilio/status
 */
router.post("/twilio/status", handleStatusWebhook);

/**
 * SendGrid Incoming Email Webhook
 * POST /api/webhooks/sendgrid/inbound
 */
router.post("/sendgrid/inbound", upload.none(), handleInboundEmail);

export default router;