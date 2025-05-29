import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// function to simulate sending an email
export const picklistEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, html, signatureData } = req.body;

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

    // Prepare the email options
    const mailOptions: any = {
      from: '"SUNNIVA" <service@vendomnia.com>',
      to,
      subject,
      html
    };

    // Conditionally add attachment if signatureData is present
    if (signatureData) {
      mailOptions.attachments = [
        {
          filename: 'signature.png',
          content: signatureData.split(',')[1], // remove "data:image/png;base64,"
          encoding: 'base64',
          cid: 'signature_cid' // reference this in the HTML img src
        }
      ];
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
