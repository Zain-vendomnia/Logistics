import React from 'react';
import { sendSMS, sendWhatsAppMessage, sendEmail } from '../../services/notification/notificationService';
import './assets/NotificationForm.css'; // Make sure to import the CSS file

const NotificationForm: React.FC = () => {
  const handleSendSMS = async () => {
    try {
      const response = await sendSMS('+18777804236', 'customer-notification', { name: 'Jahanzaib Baloch' });
      alert(`SMS Sent: ${response}`);
    } catch (error) {
      alert('Failed to send SMS');
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      const response = await sendWhatsAppMessage('+971501084381', 'customer-notification', { name: 'Jahanzaib Baloch' });
      alert(`WhatsApp Sent: ${response}`);
    } catch (error) {
      alert('Failed to send WhatsApp message');
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await sendEmail('muhammad.jahanzaibbaloch@vendomnia.com', 'Order Arrival', 'customer-notification', { name: 'Jahanzaib Baloch' });
      alert(`Email Sent: ${response}`);
    } catch (error) {
      alert('Failed to send email');
    }
  };

  // const handleSendPush = async () => {
  //   try {
  //     const response = await sendPushNotification('test-device-token', 'Test Title', 'This is a test push notification');
  //     alert(`Push Notification Sent: ${response}`);
  //   } catch (error) {
  //     alert('Failed to send push notification');
  //   }
  // };

  return (
    <div className='notification-sec'>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Send Notifications</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="notification-button" onClick={handleSendSMS}>Send SMS</button>
        <button className="notification-button" onClick={handleSendWhatsApp}>Send WhatsApp</button>
        <button className="notification-button" onClick={handleSendEmail}>Send Email</button>
        {/*<button className="notification-button" onClick={handleSendPush}>Send Push Notification</button>*/}
      </div>
    </div>
  );
};

export default NotificationForm;
