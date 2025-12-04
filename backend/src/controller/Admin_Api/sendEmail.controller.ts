import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'service@vendomnia.com',
    pass: 'zmcz avnq grtd clxw'
  }
});

// Reusable email sending function - pure sender, no template logic
export const sendEmailSMTP = async (params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}): Promise<{ messageId: string; status: string }> => {
  const {
    to,
    subject,
    html,
    replyTo = 'support@reply.vendomnia.com',
    attachments = []
  } = params;

  const mailOptions: any = {
    from: '"SUNNIVA" <service@vendomnia.com>',
    to,
    subject,
    html,
    replyTo,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);
  
  console.log('📧 Email sent via SMTP:', info.messageId);
  
  return {
    messageId: info.messageId || `smtp-${Date.now()}`,
    status: 'sent'
  };
};

// Express route handler (existing functionality)
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
      third_attachment_name
    } = req.body;

    // Build attachments array
    const attachments: Array<{ filename: string; content: string; encoding: string }> = [];

    if (attachment && attachment_name) {
      attachments.push({
        filename: attachment_name,
        content: attachment.split(',')[1],
        encoding: 'base64',
      });
    }

    if (second_attachment && second_attachment_name) {
      attachments.push({
        filename: second_attachment_name,
        content: second_attachment.split(',')[1],
        encoding: 'base64',
      });
    }

    if (third_attachment && third_attachment_name) {
      attachments.push({
        filename: third_attachment_name,
        content: third_attachment.split(',')[1],
        encoding: 'base64',
      });
    }

    // Use the reusable function - caller provides HTML
    await sendEmailSMTP({
      to,
      subject,
      html,
      attachments
    });

    return res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending email: ', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
};