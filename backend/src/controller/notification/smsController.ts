// import { renderSmsTemplate } from '../../notification-assets/utils/smsTemplates';
// import twilio from 'twilio';
// import dotenv from 'dotenv';

// dotenv.config();

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// const sendSMS = async ( 
//   to: string,
//   templateName: string,
//   templateData: Record<string, string>
// ): Promise<string> => {

//   const messageBody = renderSmsTemplate(templateName, templateData);
//   try {
//     const result = await client.messages.create({
//       body: messageBody,
//       from: process.env.TWILIO_SMS_NUMBER,  // Replace with your Twilio phone number
//       to: to,
//     });
//     return result.sid;
//   }  catch (error: unknown) {
//     if (error instanceof Error) {
//       throw new Error(`Failed to send SMS: ${error.message}`);
//     }
//     throw new Error('Failed to send SMS: Unknown error occurred.');
//   }
// };

// export { sendSMS };
