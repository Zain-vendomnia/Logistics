import twilio from "twilio";
import nodemailer from "nodemailer";

// Twilio credentials from .env
const TWILIO_SID = process.env.TWILIO_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;
// const TWILIO_SMS_NUMBER = process.env.TWILIO_SMS_NUMBER!;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID!;

// Email credentials from .env
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const EMAIL_SMTP = process.env.EMAIL_SMTP!;

// Initialize Twilio client
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// Initialize Nodemailer transporter
const emailTransporter = nodemailer.createTransport({
  host: EMAIL_SMTP,
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

interface TwilioResult {
  success: boolean;
  sid: string;
  from: string;
  error?: string;
  errorCode?: string;
  status?: string;
}

const twilioService = {
  // Send WhatsApp message
  sendWhatsApp: async (params: {
    to: string;
    body: string;
    mediaUrl?: string;
  }): Promise<TwilioResult> => {
    try {
      const messageOptions: any = {
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${params.to}`,
        body: params.body,
      };

      if (params.mediaUrl) {
        messageOptions.mediaUrl = [params.mediaUrl];
      }

      const message = await twilioClient.messages.create(messageOptions);

      return {
        success: true,
        sid: message.sid,
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      };
    } catch (error: any) {
      console.error("WhatsApp send error:", error);
      return {
        success: false,
        sid: "",
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        error: error.message,
        errorCode: error.code,
      };
    }
  },

  // Send SMS message
sendSMS: async (params: {
  to: string;
  body: string;
  mediaUrl?: string;
}): Promise<TwilioResult> => {
  try {
    const messageOptions: any = {
      messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,  // ← Add this
      to: params.to,
      body: params.body,
    };

    if (params.mediaUrl) {
      messageOptions.mediaUrl = [params.mediaUrl];
    }

    const message = await twilioClient.messages.create(messageOptions);

    return {
      success: true,
      sid: message.sid,
      from: "Sunniva SMS Service",  // ← Change this
    };
  } catch (error: any) {
    console.error("SMS send error:", error);
    return {
      success: false,
      sid: "",
      from: "Sunniva SMS Service",
      error: error.message,
      errorCode: error.code,
    };
  }
},

  // Send Email
  sendEmail: async (params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<TwilioResult> => {
    try {
      const mailOptions = {
        from: `"Vendomnia Support" <${EMAIL_USER}>`,
        to: params.to,
        subject: params.subject,
        text: params.body,
        html: `<p>${params.body.replace(/\n/g, "<br>")}</p>`,
      };

      const info = await emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        sid: info.messageId,
        from: EMAIL_USER,
      };
    } catch (error: any) {
      console.error("Email send error:", error);
      return {
        success: false,
        sid: "",
        from: EMAIL_USER,
        error: error.message,
        errorCode: error.code || "EMAIL_ERROR",
      };
    }
  },
};

export default twilioService;