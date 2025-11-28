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
  console.log(`🔊 Status normalized: ${twilioStatus} → ${normalized}`);
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

/**
 * Parse email address from various formats
 * Handles: "Name <email@domain.com>", "<email@domain.com>", "email@domain.com"
 */
const parseEmailAddress = (emailString: string): { email: string; name: string } => {
  if (!emailString) {
    return { email: "", name: "" };
  }

  // Try to match "Name <email>" format
  const matchWithName = emailString.match(/^(.+?)\s*<([^>]+)>$/);
  if (matchWithName) {
    return {
      name: matchWithName[1].trim().replace(/^["']|["']$/g, ""),
      email: matchWithName[2].trim().toLowerCase(),
    };
  }

  // Try to match "<email>" format
  const matchBrackets = emailString.match(/<([^>]+)>/);
  if (matchBrackets) {
    return {
      name: "",
      email: matchBrackets[1].trim().toLowerCase(),
    };
  }

  // Plain email format
  return {
    name: "",
    email: emailString.trim().toLowerCase(),
  };
};

/**
 * Generate unique message ID for emails
 */
const generateEmailMessageId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `email-${timestamp}-${random}`;
};

/**
 * Stronger inbound email reply stripper.
 * - Accepts plain text or text produced from HTML (recommended to call html -> text first).
 * - Returns the most-likely reply content (everything BEFORE the first quoted/forwarded block).
 */
export const cleanInboundEmailText = (raw: string | undefined | null): string => {
  if (!raw) return "";

  // 1) Normalize
  let text = String(raw);
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Collapse excessive blank lines but keep single blank line where useful
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim surrounding whitespace
  text = text.trim();

  // Helper: find earliest index of any match for given regex list
  const earliestMatchIndex = (patterns: RegExp[]): number => {
    let earliest = text.length;
    for (const p of patterns) {
      const m = p.exec(text);
      if (m && typeof m.index === "number" && m.index < earliest) earliest = m.index;
    }
    return earliest;
  };

  // 2) Patterns that indicate quoted/forwarded content
  const separators: RegExp[] = [
    // "On Fri, Nov 28, 2025 at 4:06 PM Name <email> wrote:" (Gmail style, with wrote)
    /^\s*On\s+.+wrote:\s*$/m,
    // "On Nov 28, 2025, at 4:06 PM, Name wrote:" (variation)
    /^\s*On\s+.+,\s+at\s+.+wrote:\s*$/m,
    // "From: someone@..." (common header start)
    /^\s*From:\s.*$/mi,
    // "Sent: Tue, Nov 28, 2025 4:06 PM" (Outlook headers)
    /^\s*Sent:\s.*$/mi,
    // "To: ..." or "Subject: ..." usually as a block of headers - catch when they appear on their own line
    /^\s*To:\s.*$/mi,
    /^\s*Subject:\s.*$/mi,
    // Begin forwarded/Original message
    /^\s*[-]{2,}\s*Original Message\s*[-]{2,}/mi,
    /^\s*Begin forwarded message:\s*$/mi,
    /^\s*[-]{2,}\s*Forwarded message\s*[-]{2,}/mi,
    // "-----Original Message-----"
    /-{5,}\s*Original Message\s*-{5,}/i,
    // Lines of dashes or underscores that typically separate messages
    /^\s*_{3,}\s*$/m,
    /^\s*-{3,}\s*$/m,
    // Quoted text marker lines starting with > (look for the first multi-line quoted block)
    /\n\s*>/m,
    // "wrote:" inside the message body on its own line
    /^\s*.*wrote:\s*$/mi,
    // "On <date> at <time>" single line without wrote (a lot of clients)
    /^\s*On\s+\w{3,},?.*\d{4}.*$/mi,
  ];

  const sepIndex = earliestMatchIndex(separators);

  // 3) Truncate at earliest separator
  if (sepIndex < text.length) {
    text = text.slice(0, sepIndex).trim();
  }

  // 4) Remove trailing quoted ">" lines if any remain at the end (sometimes the pattern didn't find the earliest)
  // Remove any trailing block that starts with lines beginning with ">"
  text = text.replace(/(\n\s*>[\s\S]*)$/g, "").trim();

  // 5) Remove common signature blocks:
  //  - Standard signature delimiter: "-- " on its own line plus everything after
  //  - Mobile device signatures like "Sent from my iPhone"
  const signaturePatterns = [
    /\n--\s*\n[\s\S]*$/i,               // RFC5322 signature delimiter
    /\nSent from my (iPhone|iPad|Android|Samsung|Galaxy)[\s\S]*$/i,
    /\nGet Outlook for [^\n]+[\s\S]*$/i,
    /\nBest regards[,\s\S]*$/i,        // optional but often desirable
    /\nRegards[,\s\S]*$/i,
    /\nThanks[,\s\S]*$/i,
  ];

  for (const p of signaturePatterns) {
    if (p.test(text)) {
      text = text.replace(p, "").trim();
    }
  }

  // 6) Last cleanup - collapse multiple blanks and trim
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
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
          `SELECT order_id, CONCAT(firstname, ' ', lastname) as customer_name, phone, email 
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
      email: order.email,
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
          `SELECT order_id, CONCAT(firstname, ' ', lastname) as customer_name, phone, email 
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
      email: order.email,
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

    console.log("🔊 Status webhook payload:", req.body);

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

    console.log("🔊 Status webhook received:", {
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

    console.log(`🔎 Looking up order for phone: ${phoneToLookup}`);

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
   ✅ HANDLE INBOUND EMAIL (SENDGRID INBOUND PARSE)
   POST /api/webhooks/sendgrid/inbound
   
   SendGrid sends multipart/form-data with these fields:
   - from: sender email
   - to: recipient email  
   - subject: email subject
   - text: plain text body
   - html: HTML body
   - envelope: JSON string with to/from
   - headers: email headers
   - attachments: number of attachments
   - attachment-info: JSON with attachment details
   - attachment1, attachment2, etc: actual attachments
--------------------------------------------------------- */
export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    console.log("📧 ====== EMAIL INBOUND WEBHOOK RECEIVED ======");
    console.log("📧 Request body keys:", Object.keys(req.body));
    console.log("📧 Content-Type:", req.headers["content-type"]);

    console.log("----------------------------------------------------------------------------------------------------------");
    console.log("📧 Full request body:", JSON.stringify(req.body));
    console.log("----------------------------------------------------------------------------------------------------------");
    
    // Extract fields from SendGrid Inbound Parse
    const {
      from,
      to,
      subject,
      text,
      html,
      envelope,
      attachments,
      spam_score,
      sender_ip,
      dkim,
      SPF,
    } = req.body;

    // ✅ Validate required fields
    if (!from || !to) {
      console.warn("⚠️ Missing required fields in email webhook");
      console.warn("⚠️ Received body:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        error: "Missing required fields",
        required: ["from", "to"],
        received: Object.keys(req.body),
      });
    }

    // Parse email addresses
    const parsedFrom = parseEmailAddress(from);
    const parsedTo = parseEmailAddress(to);

    console.log("📧 Email details:", {
      from: parsedFrom.email,
      fromName: parsedFrom.name,
      to: parsedTo.email,
      subject: subject || "(No Subject)",
      textLength: text?.length || 0,
      htmlLength: html?.length || 0,
      attachmentCount: attachments || 0,
      spamScore: spam_score,
      senderIP: sender_ip,
      dkim: dkim,
      spf: SPF,
    });

    // Parse envelope if available (contains original to/from)
    let envelopeData: { to?: string[]; from?: string } = {};
    if (envelope) {
      try {
        envelopeData = typeof envelope === "string" ? JSON.parse(envelope) : envelope;
        console.log("📧 Envelope data:", envelopeData);
      } catch (e) {
        console.warn("⚠️ Failed to parse envelope:", e);
      }
    }

    // ✅ Find customer by email address
    const [orders] = await retryQuery(
      () =>
        pool.query(
          `SELECT order_id, CONCAT(firstname, ' ', lastname) as customer_name, phone, email 
           FROM logistic_order 
           WHERE email = ? 
           ORDER BY order_id DESC 
           LIMIT 1`,
          [parsedFrom.email]
        ) as Promise<[any[], any]>
    );

    if (orders.length === 0) {
      console.log(`ℹ️ No order found for email: ${parsedFrom.email}`);
      
      // Log for debugging - might want to create a new contact or ticket
      console.log("📧 Unmatched email received:", {
        from: parsedFrom.email,
        subject: subject,
        timestamp: new Date().toISOString(),
      });

      // Still return 200 to prevent SendGrid retries
      return res.status(200).json({
        status: "ok",
        message: "No matching order found for sender email",
        email: parsedFrom.email,
      });
    }

    const order = orders[0];

    // Generate unique message ID
    const messageId = generateEmailMessageId();

    // Prepare message content - prefer text, fallback to stripped HTML
    let rawContent = text || "";
    if (!rawContent && html) {
      // Basic HTML stripping for message preview
      rawContent = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Strip quoted content from reply (remove "On ... wrote:" and everything after)
    const messageContent = cleanInboundEmailText(rawContent);

    console.log("📧 Message content processing:", {
      rawLength: rawContent.length,
      cleanedLength: messageContent.length,
      preview: messageContent.substring(0, 100),
    });

    // Parse attachment info if available
    let attachmentInfo: any[] = [];
    if (req.body["attachment-info"]) {
      try {
        attachmentInfo =
          typeof req.body["attachment-info"] === "string"
            ? JSON.parse(req.body["attachment-info"])
            : req.body["attachment-info"];
      } catch (e) {
        console.warn("⚠️ Failed to parse attachment-info:", e);
      }
    }

    // Build message object
    const message = {
      from: parsedFrom.email,
      to: parsedTo.email,
      message: messageContent,
      message_type: "text",
      communication_channel: "email" as const,
      direction: "inbound" as const,
      is_read: false,
      message_id: messageId,
      created_at: new Date().toISOString(),
      // Email-specific fields
      subject: subject || "(No Subject)",
      html_content: html || null,
      from_name: parsedFrom.name || null,
      attachment_count: parseInt(attachments) || 0,
      attachments: attachmentInfo.length > 0 ? attachmentInfo : null,
      spam_score: spam_score ? parseFloat(spam_score) : null,
      // Metadata
      metadata: {
        sender_ip,
        dkim,
        spf: SPF,
        envelope: envelopeData,
      },
    };

    console.log("📨 Inbound email message mapped:", {
      orderId: order.order_id,
      customer: order.customer_name,
      messageId: message.message_id,
      subject: message.subject,
      hasHtml: !!message.html_content,
      attachments: message.attachment_count,
    });

    // Save to database and broadcast
    await receiveInboundMessage(order.order_id, message);
    await broadcastInboundMessage(order.order_id, message, {
      name: order.customer_name,
      phone: order.phone,
      email: order.email,
    });

    // Invalidate customer list cache
    invalidateCustomerListCache();

    console.log(
      `✅ Email message processed | Order: ${order.order_id} | Customer: ${order.customer_name} | Subject: ${subject}`
    );

    res.status(200).json({
      status: "ok",
      message: "Email processed successfully",
      orderId: order.order_id,
      messageId: messageId,
    });
  } catch (err) {
    console.error("❌ Email webhook error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      bodyKeys: Object.keys(req.body || {}),
    });

    // ✅ Return 200 to prevent SendGrid retries
    res.status(200).json({
      status: "error",
      message: "Email webhook processed with errors",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

/* ---------------------------------------------------------
   ✅ HANDLE SENDGRID EMAIL STATUS/EVENTS WEBHOOK
   POST /api/webhooks/sendgrid/events
   
   For tracking: delivered, opened, clicked, bounced, etc.
--------------------------------------------------------- */
export const handleEmailStatusWebhook = async (req: Request, res: Response) => {
  try {
    console.log("📧 Email status webhook received");

    // SendGrid sends an array of events
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const { event: eventType, email, sg_message_id, timestamp, reason } = event;

      console.log("📧 Email event:", {
        type: eventType,
        email,
        messageId: sg_message_id,
        timestamp,
        reason,
      });

      // Map SendGrid events to our status
      const statusMap: Record<string, string> = {
        processed: "sent",
        delivered: "delivered",
        open: "read",
        click: "read",
        bounce: "failed",
        dropped: "failed",
        deferred: "queued",
        spamreport: "failed",
        unsubscribe: "delivered",
      };

      const normalizedStatus = statusMap[eventType] || eventType;

      // Find order by email
      if (email) {
        const [orders] = await pool.query(
          `SELECT order_id FROM logistic_order WHERE email = ? LIMIT 1`,
          [email]
        ) as [any[], any];

        if (orders.length > 0 && sg_message_id) {
          const orderId = orders[0].order_id;

          await updateMessageStatusById(
            orderId,
            sg_message_id,
            normalizedStatus,
            eventType === "bounce" || eventType === "dropped" ? "EMAIL_BOUNCE" : null,
            reason || null
          );

          broadcastMessageStatus(sg_message_id, orderId, normalizedStatus, "email");

          console.log(`✅ Email status updated | Order: ${orderId} | Status: ${normalizedStatus}`);
        }
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("❌ Email status webhook error:", err);
    res.status(200).json({ status: "error" });
  }
};

/* ---------------------------------------------------------
   ✅ WEBHOOK VERIFICATION / HEALTH CHECK
   GET /api/webhooks/verify
--------------------------------------------------------- */
export const verifyWebhook = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      status: "ok",
      message: "Webhook endpoint is active",
      timestamp: new Date().toISOString(),
      endpoints: {
        whatsapp: "/api/webhooks/twilio/whatsapp",
        sms: "/api/webhooks/twilio/sms",
        status: "/api/webhooks/twilio/status",
        emailInbound: "/api/webhooks/sendgrid/inbound",
        emailStatus: "/api/webhooks/sendgrid/events",
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Webhook verification failed",
    });
  }
};