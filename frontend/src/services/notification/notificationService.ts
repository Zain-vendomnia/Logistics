import axios from 'axios';

// Get the API URL from the environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/';  // Fallback to localhost if not defined


// Send SMS
const sendSMS = async (to: string, templateName: string, templateData: Record<string, string | number>) => {
  try {
    const response = await axios.post(`${API_URL}api/notifications/send-sms`, { to, templateName, templateData });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to: string, templateName: string, templateData: Record<string, string | number>) => {
  try {
    const response = await axios.post(`${API_URL}api/notifications/send-whatsapp`, { to, templateName, templateData });
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// Send Email
const sendEmail = async (to: string, subject: string, templateName: string, templateData: Record<string, string | number>) => {

  try {
    const response = await axios.post(`${API_URL}api/notifications/send-email`, { to, subject, templateName, templateData });
    return response.data;
  } catch (error) {
    console.error('Error sending Email:', error);
    throw error;
  }
};

// Send Push Notification
// const sendPushNotification = async (token: string, title: string, body: string) => {
//   try {
//     const response = await axios.post(`${API_URL}api/notifications/send-push`, { token, title, body });
//     return response.data;
//   } catch (error) {
//     console.error('Error sending Push Notification:', error);
//     throw error;
//   }
// };

export { sendSMS, sendWhatsAppMessage, sendEmail };
