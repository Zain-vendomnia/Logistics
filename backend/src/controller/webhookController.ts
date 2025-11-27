import { Request, Response } from "express";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import {
  broadcastMessageStatus,
  broadcastInboundMessage,
  invalidateCustomerListCache,
} from "../socket/communication.socket";
import { updateMessageStatusById, receiveInboundMessage } from "../services/communicationService";

/**
 * Normalize Twilio message status to our internal status format
 */
const normalizeMessageStatus = (twilioStatus: string): string => {
  const statusMap: Record<string, string> = {
    queued: "queued",
    sending: "sending",
    sent: "sent",
    delivered: "delivered",
    undelivered: "failed",
    failed: "failed",
    read: "read",
    received: "delivered",
    accepted: "sent",
  };

  const normalized = statusMap[twilioStatus.toLowerCase()] || twilioStatus.toLowerCase();
  console.log(`📊 Status normalized: ${twilioStatus} → ${normalized}`);
  return normalized;
};

/**
 * Retry database query with exponential backoff
 */
const retryQuery = async <T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms... (${maxRetries - attempt} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
};

/* ---------------------------------------------------------
   ✅ HANDLE INBOUND WHATSAPP MESSAGES
   POST /api/webhooks/twilio/whatsapp
--------------------------------------------------------- */
export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  try {
    const { From, To, Body, MessageSid, NumMedia = 0, MediaUrl0, MediaContentType0 } = req.body;

    // ✅ Validate required fields
    if (!From || !To || !MessageSid) {
      console.warn("⚠️ Missing required fields in WhatsApp webhook");
      return res.status(400).json({
        error: "Missing required fields",
        required: ["From", "To", "MessageSid"],
      });
    }

    console.log("📥 WhatsApp webhook received:", {
      from: From,
      to: To,
      messageSid: MessageSid,
      hasMedia: NumMedia > 0,
      bodyLength: Body?.length || 0,
    });

    const customerPhone = From.replace("whatsapp:", "");
    const businessPhone = To.replace("whatsapp:", "");

    // ✅ Query with retry mechanism
    const [orders] = await retryQuery(
      () =>
        pool.query(
          `SELECT order_id, CONCAT(firstname, ' ', lastname) as customer_name, phone 
           FROM logistic_order 
           WHERE phone = ? LIMIT 1`,
          [customerPhone]
        ) as Promise<[any[], any]>
    );

    if (orders.length === 0) {
      console.log(`ℹ️ No order found for phone: ${customerPhone}`);
      return res.status(200).send("OK");
    }

    const order = orders[0];

    const message = {
      from: customerPhone,
      to: businessPhone,
      message: Body || "",
      message_type: NumMedia > 0 ? "media" : "text",
      communication_channel: "whatsapp" as const,
      direction: "inbound" as const,
      is_read: false,
      message_id: MessageSid,
      created_at: new Date().toISOString(),
      mediaUrl: NumMedia > 0 ? MediaUrl0 : null,
      mediaType: NumMedia > 0 ? MediaContentType0 : null,
    };

    console.log("📨 Inbound WhatsApp message mapped:", message);

    // Save to database and broadcast
    await receiveInboundMessage(order.order_id, message);
    await broadcastInboundMessage(order.order_id, message, {
      name: order.customer_name,
      phone: order.phone,
    });

    // Invalidate customer list cache
    invalidateCustomerListCache();

    console.log(
      `✅ WhatsApp message processed | Order: ${order.order_id} | Customer: ${order.customer_name}`
    );
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ WhatsApp webhook error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
    });

    // ✅ Return 200 to prevent Twilio retries for application errors
    res.status(200).json({
      status: "error",
      message: "Webhook processed with errors",
    });
  }
};

/* ---------------------------------------------------------
   ✅ HANDLE INBOUND SMS / MMS
   POST /api/webhooks/twilio/sms
--------------------------------------------------------- */
export const handleSMSWebhook = async (req: Request, res: Response) => {
  try {
    const { From, To, Body, MessageSid, NumMedia = 0, MediaUrl0, MediaContentType0 } = req.body;

    // ✅ Validate required fields
    if (!From || !To || !MessageSid) {
      console.warn("⚠️ Missing required fields in SMS webhook");
      return res.status(400).json({
        error: "Missing required fields",
        required: ["From", "To", "MessageSid"],
      });
    }

    console.log("📥 SMS webhook received:", {
      from: From,
      to: To,
      messageSid: MessageSid,
      hasMedia: NumMedia > 0,
      bodyLength: Body?.length || 0,
    });

    // ✅ Query with retry mechanism
    const [orders] = await retryQuery(
      () =>
        pool.query(
          `SELECT order_id, CONCAT(firstname, ' ', lastname) as customer_name, phone 
           FROM logistic_order 
           WHERE phone = ? LIMIT 1`,
          [From]
        ) as Promise<[any[], any]>
    );

    if (orders.length === 0) {
      console.log(`ℹ️ No order found for phone: ${From}`);
      return res.status(200).send("OK");
    }

    const order = orders[0];

    const message = {
      from: From,
      to: To,
      message: Body || "",
      message_type: NumMedia > 0 ? "media" : "text",
      communication_channel: "sms" as const,
      direction: "inbound" as const,
      is_read: false,
      message_id: MessageSid,
      created_at: new Date().toISOString(),
      mediaUrl: NumMedia > 0 ? MediaUrl0 : null,
      mediaType: NumMedia > 0 ? MediaContentType0 : null,
    };

    // Save to database and broadcast
    await receiveInboundMessage(order.order_id, message);
    await broadcastInboundMessage(order.order_id, message, {
      name: order.customer_name,
      phone: order.phone,
    });

    // Invalidate customer list cache
    invalidateCustomerListCache();

    console.log(`✅ SMS message processed | Order: ${order.order_id} | Customer: ${order.customer_name}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ SMS webhook error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
    });

    // ✅ Return 200 to prevent Twilio retries for application errors
    res.status(200).json({
      status: "error",
      message: "Webhook processed with errors",
    });
  }
};

/* ---------------------------------------------------------
   ✅ HANDLE WHATSAPP + SMS DELIVERY STATUS
   POST /api/webhooks/twilio/status
--------------------------------------------------------- */
export const handleStatusWebhook = async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage } = req.body;
 
    console.log("📊 Status webhook payload:", req.body);
    
    // ✅ Validate required fields
    if (!MessageSid) {
      console.warn("⚠️ Missing MessageSid in status webhook");
      return res.status(400).json({
        error: "Missing required field",
        required: ["MessageSid"],
      });
    }

    if (!MessageStatus) {
      console.warn("⚠️ Missing MessageStatus in status webhook");
      return res.status(400).json({
        error: "Missing required field",
        required: ["MessageStatus"],
      });
    }

    console.log("📊 Status webhook received:", {
      messageSid: MessageSid,
      status: MessageStatus,
      to: To,
      from: From,
      hasError: !!ErrorCode,
    });

    // ✅ Normalize status using comprehensive mapping
    const normalizedStatus = normalizeMessageStatus(MessageStatus);

    // Extract phone number (prioritize To, fallback to From)
    const cleanTo = (To || "").replace(/^(whatsapp:|sms:)/, "");
    const cleanFrom = (From || "").replace(/^(whatsapp:|sms:)/, "");
    const phoneToLookup = cleanTo || cleanFrom;

    if (!phoneToLookup) {
      console.warn("⚠️ No phone number found in status webhook");
      return res.status(200).send("OK");
    }

    console.log(`📖 Looking up order for phone: ${phoneToLookup}`);

    // ✅ Query with retry mechanism and type safety
    const [rows] = await retryQuery(
      () =>
        pool.query(`SELECT order_id FROM logistic_order WHERE phone = ? LIMIT 1`, [
          phoneToLookup,
        ]) as Promise<[RowDataPacket[], any]>
    );

    if (!rows || rows.length === 0) {
      console.log(`ℹ️ No order found for phone: ${phoneToLookup}`);
      return res.status(200).send("OK");
    }

    const orderId = (rows[0] as any).order_id;
    console.log(`✅ Found order: ${orderId} for message: ${MessageSid}`);

    // ✅ Update message status in database
    await updateMessageStatusById(
      orderId,
      MessageSid,
      normalizedStatus,
      ErrorCode ?? null,
      ErrorMessage ?? null
    );

    // ✅ Detect channel from To/From prefix
    const channel = (To || "").startsWith("whatsapp:") ? "whatsapp" : "sms";

    // ✅ Broadcast status update via WebSocket
    broadcastMessageStatus(MessageSid, orderId, normalizedStatus, channel);

    // Invalidate customer list cache
    invalidateCustomerListCache();

    console.log(
      `✅ Status update broadcasted | ${normalizedStatus} | Order: ${orderId} | Channel: ${channel} | MessageID: ${MessageSid}`
    );

    return res.status(200).send("OK");
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Status webhook error:", {
      error: errMsg,
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
    });

    // ✅ Return 200 to prevent Twilio retries
    return res.status(200).json({
      status: "error",
      message: "Status webhook processed with errors",
    });
  }
};

/* ---------------------------------------------------------
   ✅ HANDLE INBOUND EMAIL (SENDGRID)
   POST /api/webhooks/sendgrid/inbound
--------------------------------------------------------- */
export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 Email inbound webhook received");

    const payload = req.body;

    const from = payload.from;
    const to = payload.to;
    const subject = payload.subject;
    const text = payload.text;
    const html = payload.html;

    // ✅ Validate required fields
    if (!from || !to) {
      console.warn("⚠️ Missing required fields in email webhook");
      return res.status(400).json({
        error: "Missing required fields",
        required: ["from", "to"],
      });
    }

    console.log("📧 Email details:", {
      from,
      to,
      subject,
      textLength: text?.length || 0,
      htmlLength: html?.length || 0,
    });

    // TODO: Implement email processing logic
    // 1. Map email to order (by email address or order number in subject)
    // 2. Store in customer_chats table
    // 3. Broadcast to admins
    // 4. Create ticket if needed

    console.log("ℹ️ Email processing not yet implemented");

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Email webhook error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
    });

    // ✅ Return 200 to prevent SendGrid retries
    res.status(200).json({
      status: "error",
      message: "Email webhook processed with errors",
    });
  }
};

/* ---------------------------------------------------------
   ✅ WEBHOOK VERIFICATION (Optional but recommended)
   GET /api/webhooks/twilio/verify
--------------------------------------------------------- */
export const verifyWebhook = async (_req: Request, res: Response) => {
  try {
    // This endpoint can be used for webhook health checks
    res.status(200).json({
      status: "ok",
      message: "Webhook endpoint is active",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Webhook verification failed",
    });
  }
};