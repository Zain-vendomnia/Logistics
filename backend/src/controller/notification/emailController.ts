import { Request, Response } from "express";
import { renderTemplate } from "../../notification-assets/utils/emailTemplates";
import { EmailPayload, sendEmailAsync } from "../../services/smpt.service";

export const sendEmail = async (req: Request, res: Response) => {
  const { to, subject, templateName, templateData } = req.body;

  if (!to || !subject || !templateName || !templateData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const htmlContent = renderTemplate(templateName, templateData);

    const payload: EmailPayload = {
      to,
      subject,
      html: htmlContent,
    };

    await sendEmailAsync(payload);
    res.status(201).json({ error: "Email sent successfully" });
  } catch (error) {
    console.error("Error in send-email route:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};
