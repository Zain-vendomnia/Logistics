import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// function to simulate sending an email
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, html, attachment,attachment_name, second_attachment,
      second_attachment_name, third_attachment,
      third_attachment_name } = req.body;


    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'service@vendomnia.com',
        pass: 'zmcz avnq grtd clxw'
      }
    });

    // Prepare the base email options
    const mailOptions: any = {
      from: '"SUNNIVA" <service@vendomnia.com>',
      to,
      subject,
      html,
      attachments: []
    };

    // Add the first attachment if available
    if (attachment && attachment_name) {
      mailOptions.attachments.push({
        filename: attachment_name,
        content: attachment.split(',')[1],
        encoding: 'base64',
      });
    }

    // Conditionally add the second attachment if available
    if (second_attachment && second_attachment_name) {
      mailOptions.attachments.push({
        filename: second_attachment_name,
        content: second_attachment.split(',')[1],
        encoding: 'base64',
      });
    }
    // Conditionally add the third attachment if available
    if (third_attachment && third_attachment_name) {
      mailOptions.attachments.push({
        filename: third_attachment_name,
        content: third_attachment.split(',')[1],
        encoding: 'base64',
      });
    }
    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ', info.response);
    return res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending email: ', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
};
