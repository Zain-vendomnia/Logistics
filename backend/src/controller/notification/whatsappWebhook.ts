import { Request, Response } from "express";
import pool from "../../config/database"; // Changed from 'connect' to 'pool'

const receiveWhatsAppMessage = async (req: Request, res: Response) => {
  const normalizeNumber = (val: string) =>
    val.replace("whatsapp:", "").replace(/\s+/g, "").trim();

  const from = normalizeNumber(req.body.From);
  const to = normalizeNumber(req.body.To);
  const body = req.body.Body;

  try {
    await pool.query(
      "INSERT INTO whatsapp_chats (`from`, `to`, body, direction) VALUES (?, ?, ?, ?)",
      [from, to, body, "inbound"]
    );

    console.log("✅ WhatsApp message saved to DB");
    res.status(200).send("<Response></Response>"); // Twilio expects a 200 response
  } catch (error) {
    console.error("❌ Error saving WhatsApp message:", error);
    res.status(500).send("Error new");
  }
};

export default receiveWhatsAppMessage;
