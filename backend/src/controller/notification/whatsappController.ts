import { renderWhatsAppTemplate } from '../../notification-assets/utils/whatsappTemplates';
import * as messageService from '../../services/messageService';

// const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

const sendWhatsAppMessage = async (
  to: string,
  templateName: string,
  templateData: Record<string, string>
): Promise<string> => {
  const messageBody = renderWhatsAppTemplate(templateName, templateData);
  console.log('Rendered WhatsApp Message:', messageBody); // Debug log
  const orderId = "113";
  const messageData = {
    sender: "customer",
    content: messageBody,
    type: "text" as const,
    phone_number: to
  };

  try {
    const result = await messageService.sendMessage(orderId, messageData);
    
    // Handle the result based on your messageService response structure
    if (result.success) {
      return result.message?.id || 'Message sent successfully';
    } else {
      throw new Error(result.error || 'Failed to send message');
    }
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
    throw new Error('Failed to send WhatsApp: Unknown error occurred.');
  }
};

export { sendWhatsAppMessage };