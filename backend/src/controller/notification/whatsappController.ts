import { renderWhatsAppTemplate } from '../../notification-assets/utils/whatsappTemplates';
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

const sendWhatsAppMessage = async (
  to: string,
  templateName: string,
  templateData: Record<string, string>
): Promise<string> => {
  const messageBody = renderWhatsAppTemplate(templateName, templateData);

  try {
    const twilioRes = await client.messages.create({
      body: messageBody,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });

    if (twilioRes.sid) {
      return twilioRes.sid;
    }

    throw new Error("Message rejected by Twilio");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
    throw new Error("Failed to send WhatsApp: Unknown error occurred.");
  }
};

export { sendWhatsAppMessage };