import { renderWhatsAppTemplate } from '../../notification-assets/utils/whatsappTemplates';
import twilio from 'twilio';
import dotenv from 'dotenv';
import pool from '../../database'; // ✅ Renamed for clarity — pool, not a function

dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

const sendWhatsAppMessage = async (
  to: string,
  templateName: string,
  templateData: Record<string, string>
): Promise<string> => {
  const messageBody = renderWhatsAppTemplate(templateName, templateData);

  try {
    // ✅ Send the WhatsApp message via Twilio
    const result = await client.messages.create({
      body: messageBody,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });

    // ✅ Save the message to the database
    const query = `
      INSERT INTO whatsapp_chats (\`from\`, \`to\`, body, direction) 
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      messageBody,
      'outbound',
    ];

    await pool.query(query, values); // ✅ Use pool directly

    return result.sid;

  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
    throw new Error('Failed to send WhatsApp: Unknown error occurred.');
  }
};

export { sendWhatsAppMessage };
