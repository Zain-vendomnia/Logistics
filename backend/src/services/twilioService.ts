import twilio from "twilio";
import sgMail from "@sendgrid/mail";

// ============================================
// Twilio Configuration
// ============================================
const TWILIO_SID = process.env.TWILIO_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID!;

// ============================================
// SendGrid Configuration
// ============================================
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL!;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Sunniva Support";

// ============================================
// Initialize Clients
// ============================================

// Initialize Twilio client
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  // console.log("✅ SendGrid API initialized");
} else {
  console.warn("⚠️ SENDGRID_API_KEY not configured");
}

// ============================================
// Types
// ============================================
interface TwilioResult {
  success: boolean;
  sid: string;
  from: string;
  error?: string;
  errorCode?: string;
  status?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  orderId?: number;
}

// ============================================
// Service Functions
// ============================================
const twilioService = {
  /**
   * Send WhatsApp message via Twilio
   */
  sendWhatsApp: async (params: {
    to: string;
    body: string;
    mediaUrl?: string;
  }): Promise<TwilioResult> => {
    try {
      console.log(`📱 Sending WhatsApp to: ${params.to}`);

      const messageOptions: any = {
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${params.to}`,
        body: params.body,
      };

      if (params.mediaUrl) {
        messageOptions.mediaUrl = [params.mediaUrl];
      }

      const message = await twilioClient.messages.create(messageOptions);

      console.log(`✅ WhatsApp sent | SID: ${message.sid} | Status: ${message.status}`);

      return {
        success: true,
        sid: message.sid,
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        status: message.status,
      };
    } catch (error: any) {
      console.error("❌ WhatsApp send error:", {
        message: error.message,
        code: error.code,
        to: params.to,
      });

      return {
        success: false,
        sid: "",
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        error: error.message,
        errorCode: error.code?.toString(),
      };
    }
  },

  /**
   * Send SMS message via Twilio Messaging Service
   */
  sendSMS: async (params: {
    to: string;
    body: string;
    mediaUrl?: string;
  }): Promise<TwilioResult> => {
    try {
      console.log(`📲 Sending SMS to: ${params.to}`);

      const messageOptions: any = {
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
        to: params.to,
        body: params.body,
      };

      if (params.mediaUrl) {
        messageOptions.mediaUrl = [params.mediaUrl];
      }

      const message = await twilioClient.messages.create(messageOptions);

      console.log(`✅ SMS sent | SID: ${message.sid} | Status: ${message.status}`);

      return {
        success: true,
        sid: message.sid,
        from: "Sunniva SMS Service",
        status: message.status,
      };
    } catch (error: any) {
      console.error("❌ SMS send error:", {
        message: error.message,
        code: error.code,
        to: params.to,
      });

      return {
        success: false,
        sid: "",
        from: "Sunniva SMS Service",
        error: error.message,
        errorCode: error.code?.toString(),
      };
    }
  },

  /**
   * Send Email via SendGrid API
   */
  sendEmail: async (params: SendEmailParams): Promise<TwilioResult> => {
    try {
      console.log(`📧 Sending email via SendGrid to: ${params.to}`);

      // Validate SendGrid configuration
      if (!SENDGRID_API_KEY) {
        throw new Error("SendGrid API key not configured");
      }

      if (!SENDGRID_FROM_EMAIL) {
        throw new Error("SendGrid from email not configured");
      }

      // Reply-To address for inbound parse (customers reply to this)
      const SENDGRID_REPLY_TO = process.env.SENDGRID_REPLY_TO || `support@reply.vendomnia.com`;

      // Build email message
      const msg: sgMail.MailDataRequired = {
        to: params.to,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME,
        },
        replyTo: params.replyTo || SENDGRID_REPLY_TO,
        subject: params.subject,
        text: params.body,
        html: params.html || generateHtmlBody(params.body),
      };

      // Send email
      const response = await sgMail.send(msg);

      // Extract message ID from response headers
      const messageId =
        response[0]?.headers?.["x-message-id"] ||
        `sg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      console.log(`✅ Email sent successfully | MessageID: ${messageId} | To: ${params.to}`);

      return {
        success: true,
        sid: messageId,
        from: SENDGRID_FROM_EMAIL,
        status: "sent",
      };
    } catch (error: any) {
      // Extract SendGrid specific error details
      let errorMessage = error.message;
      let errorCode = "SENDGRID_ERROR";

      if (error.response?.body?.errors) {
        const sgError = error.response.body.errors[0];
        errorMessage = sgError?.message || error.message;
        errorCode = sgError?.field || error.code || "SENDGRID_ERROR";
      }

      console.error("❌ SendGrid email error:", {
        message: errorMessage,
        code: errorCode,
        to: params.to,
        statusCode: error.code,
      });

      return {
        success: false,
        sid: "",
        from: SENDGRID_FROM_EMAIL || "",
        error: errorMessage,
        errorCode: errorCode,
      };
    }
  },

  /**
   * Verify Twilio configuration
   */
  verifyTwilioConfig: (): boolean => {
    const required = [
      { name: "TWILIO_SID", value: TWILIO_SID },
      { name: "TWILIO_AUTH_TOKEN", value: TWILIO_AUTH_TOKEN },
      { name: "TWILIO_WHATSAPP_NUMBER", value: TWILIO_WHATSAPP_NUMBER },
      { name: "TWILIO_MESSAGING_SERVICE_SID", value: TWILIO_MESSAGING_SERVICE_SID },
    ];

    const missing = required.filter((r) => !r.value);

    if (missing.length > 0) {
      console.warn("⚠️ Missing Twilio config:", missing.map((m) => m.name).join(", "));
      return false;
    }

    return true;
  },

  /**
   * Verify SendGrid configuration
   */
  verifySendGridConfig: (): boolean => {
    const required = [
      { name: "SENDGRID_API_KEY", value: SENDGRID_API_KEY },
      { name: "SENDGRID_FROM_EMAIL", value: SENDGRID_FROM_EMAIL },
    ];

    const missing = required.filter((r) => !r.value);

    if (missing.length > 0) {
      console.warn("⚠️ Missing SendGrid config:", missing.map((m) => m.name).join(", "));
      return false;
    }

    return true;
  },
};

/**
 * Generate HTML body from plain text
 */
function generateHtmlBody(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Convert newlines to <br> and wrap in HTML
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>${escaped.replace(/\n/g, "<br>")}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent by Sunniva Support. Please do not reply directly to this email.
        </p>
      </body>
    </html>
  `;
}

export default twilioService;