import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// Dummy function to simulate sending an email
export const picklistEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // usually 587 for TLS
      secure: false, // use TLS
      auth: {
        user: 'service@vendomnia.com',
        pass: 'zmcz avnq grtd clxw'
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: '"SUNNIVA" <service@vendomnia.com>',
      to,
      subject,
      html
    });

    console.log('Email sent: ', info.response);
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email: ', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
};
