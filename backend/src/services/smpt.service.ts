import nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  content: string;
  encoding: string;
};
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP,
  port: 587, // 587 for TLS
  secure: false, // false = TLS, true = SSL (port 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const REPLY_TO = "support@reply.vendomnia.com";

export async function sendEmailAsync(
  payload: EmailPayload,
): Promise<{ messageId: string; status: boolean }> {
  const { to, subject, html, replyTo = REPLY_TO, attachments = [] } = payload;

  let result = { messageId: "", status: false };

  try {
    const mailOptions: any = {
      from: `"SUNNIVA" ${REPLY_TO}`,
      to,
      subject,
      html,
      replyTo,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email|SMPT sent messageId:", info.messageId);
    console.log("Email|SMPT response:", info.response);

    result = {
      messageId: info.messageId || `smtp-${Date.now()}`,
      status: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(`Email SMPT Error: ${Date.now()} |  ${error}`);
  } finally {
    return result;
  }
}
