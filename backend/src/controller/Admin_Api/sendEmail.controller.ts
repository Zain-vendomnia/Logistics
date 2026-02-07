import { Request, Response } from "express";
import {
  EmailAttachment,
  EmailPayload,
  sendEmailAsync,
} from "../../services/smpt.service";

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const {
      to,
      subject,
      html,
      attachment,
      attachment_name,
      second_attachment,
      second_attachment_name,
      third_attachment,
      third_attachment_name,
    } = req.body;

    const attachments: EmailAttachment[] = [];

    if (attachment && attachment_name) {
      attachments.push({
        filename: attachment_name,
        content: attachment.split(",")[1],
        encoding: "base64",
      });
    }

    if (second_attachment && second_attachment_name) {
      attachments.push({
        filename: second_attachment_name,
        content: second_attachment.split(",")[1],
        encoding: "base64",
      });
    }

    if (third_attachment && third_attachment_name) {
      attachments.push({
        filename: third_attachment_name,
        content: third_attachment.split(",")[1],
        encoding: "base64",
      });
    }

    const paylaod: EmailPayload = {
      to,
      subject,
      html,
      attachments,
    };
    await sendEmailAsync(paylaod);

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email: ", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
};
