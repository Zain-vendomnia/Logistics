// import nodemailer from 'nodemailer';
// import { renderTemplate } from '../../notification-assets/utils/emailTemplates';

// import dotenv from 'dotenv';
// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_SMTP,   // or your SMTP host
//   port: 587,                // 587 for TLS
//   secure: false,            // false = TLS (STARTTLS), true = SSL (port 465)
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendEmail = async (
//   to: string,
//   subject: string,
//   templateName: string,
//   templateData: Record<string, string | number>
// ): Promise<string> => {

//   const htmlContent = renderTemplate(templateName, templateData);

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     html: htmlContent,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     return info.response;
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       throw new Error(`Failed to send email: ${error.message}`);
//     }
//     throw new Error('Failed to send email: Unknown error occurred.');
//   }
// };

// export { sendEmail };
