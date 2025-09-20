import twilio from "twilio";
import dotenv from "dotenv";
import pool from "../../config/database"; // ✅ Renamed from 'connect' for clarity

dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

const sendWhatsAppMessageChat = async (
  to: string,
  message: string
): Promise<string> => {
  try {
    // ✅ Send the WhatsApp message via Twilio
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });

    // ✅ Save message to the database
    const query = `
      INSERT INTO whatsapp_chats (\`from\`, \`to\`, body, direction)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      message,
      "outbound",
    ];

    await pool.query(query, values); // ✅ Use pool directly without calling it

    return result.sid;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
    throw new Error("Failed to send WhatsApp: Unknown error occurred.");
  }
};

export { sendWhatsAppMessageChat };
