import { Router, Request, Response } from 'express';
import { sendEmail } from '../controller/notification/emailController';
import { sendSMS } from '../controller/notification/smsController';
import { sendWhatsAppMessage } from '../controller/notification/whatsappController';


const router = Router();

// Send email route
router.post('/send-email', sendEmail);
// router.post('/send-email', async (req: Request, res: Response) => {
//   const { to, subject, templateName, templateData} = req.body;


//   // // Check for required fields
//   if (!to || !subject || !templateName || !templateData) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   try {

//     // Use the email controller to send the email (passing HTML content as 'message')
//     const emailResponse = await sendEmail( to, subject, templateName, templateData );

//     res.json({ message: 'Email sent successfully', response: emailResponse });
//   } catch (error) {
//     console.error('Error in send-email route:', error);
//     res.status(500).json({ error: 'Failed to send email' });
//   }
// });

// Send sms route
router.post('/send-sms', async (req: Request, res: Response) => {
  const { to, templateName, templateData} = req.body;


  // // Check for required fields
  if (!to || !templateName || !templateData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

    // Use the email controller to send the email (passing HTML content as 'message')
    const smsResponse = await sendSMS( to, templateName, templateData );

    res.json({ message: 'SMS sent successfully', response: smsResponse });
  } catch (error) {
    console.error('Error in send-sms route:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Send whatsapp route
router.post('/send-whatsapp', async (req: Request, res: Response) => {
  const { to, templateName, templateData } = req.body;

  // // Check for required fields
  if (!to || !templateName || !templateData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

    // Use the email controller to send the email (passing HTML content as 'message')
    const whatsappResponse = await sendWhatsAppMessage( to, templateName, templateData);

    res.json({ message: 'WhatsApp sent successfully', response: whatsappResponse });
  } catch (error) {
    console.error('Error in send-WhatsApp route:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp' });
  }
});

export default router;
