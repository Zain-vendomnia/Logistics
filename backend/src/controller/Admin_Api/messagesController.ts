import { Request, Response } from "express";
import * as messageService from "../../services/messageService";


/**
 * Get all messages for a specific order
 */
export const getMessagesByOrderId = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        status: "error",
        message: "Order ID is required",
      });
    }

    const messages = await messageService.getMessagesByOrderId(orderId);
    return res.json({
      status: "success",
      data: messages
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Send a new message (text or file)
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { sender, content, type, fileName, phone_number } = req.body;

    // Validation
    if (!orderId || !sender || !content || !type || !phone_number) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    if (!["text", "file"].includes(type)) {
      return res.status(400).json({
        status: "error", 
        message: "Type must be 'text' or 'file'",
      });
    }

    const messageData = {
      sender,
      content: content.trim(),
      type: type as "text" | "file",
      phone_number,
      ...(fileName && { fileName }),
    };

    const result = await messageService.sendMessage(orderId, messageData);

    if (result.success) {
      return res.json({
        status: "success",
        data: result.message
      });
    } else {
      return res.status(400).json({
        status: "error", 
        message: result.error
      });
    }

  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Update unread count
 */
export const updateUnreadCount = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { unreadCount } = req.body;

    if (!orderId || unreadCount === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Order ID and unread count are required",
      });
    }

    const result = await messageService.updateCustomerUnreadCount(orderId, unreadCount);
    return res.json(result);
  } catch (err) {
    console.error("Error updating unread count:", err);
    return res.status(500).json({
      status: "error", 
      message: "Internal server error",
    });
  }
};

/**
 * Handle Twilio status webhook
 */
export const handleTwilioStatusWebhook = async (req: Request, res: Response) => {
  console.log("-----------------------------------------------------");
  console.log("am triggered nagaraj")
  try {
    const { MessageSid, MessageStatus } = req.body;

    console.log("Twilio Status Update:", { MessageSid, MessageStatus });

    if (MessageSid && MessageStatus) {
      await messageService.updateMessageDeliveryStatus(MessageSid, MessageStatus);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error("Error in status webhook:", error);
    return res.status(200).send('OK');
  }
};

/**
 * Map Twilio message type to WhatsApp message type
 */
// const mapTwilioMessageType = (numMedia: string | undefined, body: string | undefined): messageService.WhatsAppMessageType => {
//   const hasMedia = numMedia && parseInt(numMedia) > 0;
  
//   if (!hasMedia) {
//     return "text";
//   }
  
//   // For media messages, we default to "document" since we don't have the exact type
//   // In a real implementation, you might want to check MediaContentType0 to determine
//   // if it's image, video, audio, etc.
//   return "document";
// };

/**
 * Handle incoming WhatsApp messages
 */
export const handleTwilioIncomingWebhook = async (req: Request, res: Response) => {
  try {
    console.log("-----------------------------------------------------");
    console.log("Incoming Webhook Payload:", req.body);
    console.log("-----------------------------------------------------");

    const {
      MessageSid,
      From,
      Body,
      NumMedia,
      ProfileName,
      MessageType,
      SmsStatus,
      WaId,
      AccountSid,
      ChannelMetadata,
      MediaUrl0,
      MediaContentType0,
    } = req.body;

    // ✅ Step 1: Validate required fields
    if (!MessageSid || !From) {
      console.error("❌ Missing required fields:", { MessageSid, From });
      return res.status(200).send("OK");
    }

    // ✅ Step 2: Extract phone number
    const phoneNumber = From?.replace("whatsapp:", "").trim();
    if (!phoneNumber || phoneNumber.length < 10) {
      console.error("❌ Invalid phone number format:", From);
      return res.status(200).send("OK");
    }

    // ✅ Step 3: Determine message type & content
    const isMedia = NumMedia && parseInt(NumMedia) > 0;
    const whatsappMessageType = MessageType
    const messageBody = isMedia ? `[${whatsappMessageType}]` : (Body || "").trim();

    // ✅ Step 4: Validate message body
    if (whatsappMessageType === "text" && !messageBody) {
      console.error("❌ Empty text message body");
      return res.status(200).send("OK");
    }

    // ✅ Step 5: Prepare data for service
    const incomingMessageData = {
      twilioSid: MessageSid,
      phoneNumber,
      messageBody,
      messageType: whatsappMessageType,
      waId: WaId,
      profileName: ProfileName,
      smsStatus: SmsStatus,
      accountSid: AccountSid,
      channelMetadata: ChannelMetadata,
      mediaUrl: MediaUrl0,
      mediaContentType: MediaContentType0,
    };

    // ✅ Step 6: Pass to service
    const result = await messageService.handleIncomingMessage(incomingMessageData);

    if (result.success) {
      console.log("✅ Incoming message processed successfully");
    } else {
      console.error("❌ Service error:", result.error);
    }

    // ✅ Always respond 200 OK
    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Controller error:", error);
    console.error("Request body:", req.body);
    return res.status(200).send("OK"); // prevent Twilio retries
  }
};

/**
 * Test webhook endpoint
 */
export const testWebhookEndpoint = async (req: Request, res: Response) => {
  console.log("-----------------------------------------------------");
  console.log(req);
  console.log("-----------------------------------------------------");
  return res.json({
    status: "success",
    message: "Webhook endpoints are working!",
    timestamp: new Date().toISOString()
  });
};