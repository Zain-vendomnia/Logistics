import { Request, Response } from "express";
import * as messageService from "../../services/messageService";
import { downloadAndStoreMedia } from "../../utils/mediaDownloader"; 

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
    console.log("-------------------------------------------------------")
    console.log( req.body)
    console.log("-------------------------------------------------------")
    const { 
      sender, 
      content, 
      type, 
      fileName, 
      phone_number,
      fileUrl,
      fileType 
    } = req.body;

    // Validation
    if (!orderId || !sender || !type || !phone_number) {
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

    // For text messages, content is required
    // For file messages, fileUrl is required
    if (type === "text" && !content) {
      return res.status(400).json({
        status: "error",
        message: "Content is required for text messages",
      });
    }

    if (type === "file" && !fileUrl) {
      return res.status(400).json({
        status: "error",
        message: "File URL is required for file messages",
      });
    }

    const messageData = {
      sender,
      content: content?.trim() || '',
      type: type as "text" | "file",
      phone_number,
      ...(fileName && { fileName }),
      ...(fileUrl && { fileUrl }),
      ...(fileType && { fileType }),
    };

    console.log('Sending message:', { orderId, type, hasFileUrl: !!fileUrl });

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
    console.log("------------------------------------------------------");
    console.log("req Payload:", req.body);
    console.log("------------------------------------------------------");
    const { MessageSid, MessageStatus, ErrorCode,ErrorMessage } = req.body;


    if (MessageSid && MessageStatus) {
      await messageService.updateMessageDeliveryStatus(MessageSid, MessageStatus, ErrorCode, ErrorMessage);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error("Error in status webhook:", error);
    return res.status(200).send('OK');
  }
};

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
    const whatsappMessageType = MessageType;
    const messageBody = isMedia ? `[${whatsappMessageType}]` : (Body || "").trim();

    // ✅ Step 4: Validate message body
    if (whatsappMessageType === "text" && !messageBody) {
      console.error("❌ Empty text message body");
      return res.status(200).send("OK");
    }

    // ✅ NEW STEP 5: Download media if present
    let localMediaUrl = null;
    let localFileName = null;
    let localFileType = null;
    let localFileSize = null;

    if (isMedia && MediaUrl0 && MediaContentType0) {
      console.log("📥 Downloading media file...", { 
        MediaUrl0, 
        MediaContentType0, 
        MessageSid 
      });
      
      const downloadResult = await downloadAndStoreMedia(
        MediaUrl0, 
        MediaContentType0, 
        MessageSid
      );

      if (downloadResult.success) {
        localMediaUrl = downloadResult.localUrl;
        localFileName = downloadResult.fileName;
        localFileType = downloadResult.fileType;
        localFileSize = downloadResult.fileSize;
        console.log("✅ Media downloaded successfully:", localMediaUrl);
      } else {
        console.error("❌ Media download failed:", downloadResult.error);
        // Continue processing - we'll use the original Twilio URL as fallback
      }
    }

    // ✅ Step 6: Prepare data for service (with local media URLs if available)
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
      // Use local URL if download was successful, otherwise fallback to Twilio URL
      mediaUrl: localMediaUrl || MediaUrl0,
      mediaContentType: MediaContentType0,
      // Add additional fields for local file info
      ...(localFileName && { fileName: localFileName }),
      ...(localFileType && { fileType: localFileType }),
      ...(localFileSize && { fileSize: localFileSize }),
      // Keep original Twilio URL for reference/backup
      ...(MediaUrl0 && { originalTwilioUrl: MediaUrl0 }),
    };

    console.log("📩 Processing incoming message:", {
      twilioSid: MessageSid,
      phoneNumber,
      messageType: whatsappMessageType,
      bodyLength: messageBody.length,
      waId: WaId,
      profileName: ProfileName,
      smsStatus: SmsStatus,
      accountSid: AccountSid,
      // Show which URL we're using
      mediaUrl: localMediaUrl || MediaUrl0,
      isLocalMedia: !!localMediaUrl,
      ...(localFileName && { fileName: localFileName }),
      ...(localFileSize && { fileSize: localFileSize })
    });

    // ✅ Step 7: Pass to service
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


/**
 * Upload file controller
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const orderId = req.body.orderId;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Generate public URL for the file
    const baseUrl = process.env.HOST_URL 
    const fileUrl = `${baseUrl}/api/admin/messages/files/${file.filename}`;

    console.log('File uploaded successfully:', {
      originalName: file.originalname,
      storedName: file.filename,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size
    });

    res.json({
      success: true,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during file upload'
    });
  }
};

