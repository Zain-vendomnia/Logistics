import admin from 'firebase-admin';

// Initialize Firebase with your service account key
const serviceAccount = require('path/to/your/firebase-service-account-file.json');  // Replace with the actual file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = async (token: string, title: string, body: string): Promise<any> => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,  // Device token for the recipient
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    throw new Error(`Failed to send push notification: ${error.message}`);
  }
};

export { sendPushNotification };
