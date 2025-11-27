import express from "express";
import {
  handleWhatsAppWebhook,
  handleSMSWebhook,
  handleStatusWebhook,
  handleInboundEmail,
} from "../controller/webhookController";

const router = express.Router();

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
router.post("/sendgrid/inbound", handleInboundEmail);

export default router;
