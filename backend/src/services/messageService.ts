// src/services/messages.service.ts
import pool from "../database";
import { emitMessageToOrder, emitMessageUpdate, emitMessageStatusUpdate } from "../socket";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

export type WhatsAppMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "location"
  | "contacts"
  | "sticker"
  | "unknown";

export interface Message {
  id: string;
  order_id: string;
  from: string;
  to: string;
  body: string;
  sender: string;
  content: string;
  direction: "inbound" | "outbound";
  message_type: "text" | "file";
  created_at: string;
  updated_at: string;
  delivery_status: string;
  is_read: number;
  timestamp: string;
  type: WhatsAppMessageType;
  fileName?: string;
  twilio_sid?: string | null;
  fileUrl?: string;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  readAt?: string | null;
}

export interface MessageRequest {
  sender: string;
  content: string;
  type: "text" | "file";
  fileName?: string;
  phone_number: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
  twilioStatus?: string;
}

type DBRow = {
  id: number;
  order_id: string;
  from: string;
  to: string;
  body: string;
  direction: "inbound" | "outbound";
  message_type: "text" | "file";
  created_at: Date;
  updated_at: Date;
  delivery_status: string;
  is_read: number;
  twilio_sid?: string | null;
  media_url?: string | null;
  media_content_type?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  read_at?: Date | null;
};

export interface IncomingMessageData {
  twilioSid: string;
  phoneNumber: string;
  messageBody: string;
  messageType: WhatsAppMessageType;
  profileName?: string;
  smsStatus?: string;
  waId?: string;
  accountSid?: string;
  channelMetadata?: string;
  mediaUrl?: string;
  mediaContentType?: string;
}

export interface IncomingMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

const mapTwilioStatusToDeliveryStatus = (twilioStatus: string): string => {
  const map: Record<string, string> = {
    accepted: "pending",
    queued: "pending",
    sending: "sent",
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
    undelivered: "failed",
  };
  return map[twilioStatus] ?? "pending";
};

/**
 * Read messages for an order
 */
export const getMessagesByOrderId = async (orderId: string): Promise<Message[]> => {
  const q = `
    SELECT id, order_id, \`from\`, \`to\`, body, direction, message_type, 
           created_at, updated_at, delivery_status, is_read, twilio_sid, 
           media_url, media_content_type, error_code, error_message, read_at
      FROM whatsapp_chats
     WHERE order_id = ?
     ORDER BY created_at ASC
  `;
  try {
    const [rows] = (await pool.query(q, [orderId])) as [DBRow[], any];
    return rows.map((r) => ({
      id: r.id.toString(),
      order_id: r.order_id,
      from: r.from,
      to: r.to,
      body: r.body,
      sender: r.direction === "outbound" ? "You" : r.from,
      content: r.body,
      direction: r.direction,
      message_type: r.message_type,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
      delivery_status: r.delivery_status,
      is_read: r.is_read,
      timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: (r.message_type === "file" ? "document" : "text") as WhatsAppMessageType,
      twilio_sid: r.twilio_sid ?? null,
      fileUrl: r.media_url ?? undefined,
      fileType: r.media_content_type ?? undefined,
      errorCode: r.error_code ?? undefined,
      errorMessage: r.error_message ?? undefined,
      readAt: r.read_at ? r.read_at.toISOString() : null,
      ...(r.message_type === "file" && { 
        fileName: r.media_content_type ? `attachment.${r.media_content_type.split('/')[1] || 'file'}` : "attachment"
      }),
    }));
  } catch (err) {
    console.error("getMessagesByOrderId error:", err);
    throw err;
  }
};

/**
 * Send message with proper optimistic updates
 */
export const sendMessage = async (
  orderId: string,
  messageData: MessageRequest
): Promise<SendMessageResponse> => {
  const now = new Date();
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Create optimistic message
  const optimisticMessage: Message = {
    id: tempId,
    order_id: orderId,
    from: "admin",
    to: orderId,
    body: messageData.content,
    sender: "You",
    content: messageData.content,
    direction: "outbound",
    message_type: messageData.type,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    delivery_status: "sending", // Optimistic status
    is_read: 0,
    timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: messageData.type === "file" ? "document" : "text",
    twilio_sid: null,
    readAt: null,
    ...(messageData.fileName && { fileName: messageData.fileName }),
  };

  try {
    console.log("Sending message:", { orderId, messageData });

    // PHASE 1: Send optimistic message immediately to UI
    console.log("Broadcasting optimistic message to UI");
    emitMessageToOrder(orderId, optimisticMessage);

    // PHASE 2: Send via Twilio
    console.log("Sending via Twilio...");
    const twilioResponse = await client.messages.create({
      body: messageData.content,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${messageData.phone_number}`,
    });

    console.log("Twilio Response:", {
      sid: twilioResponse.sid,
      status: twilioResponse.status,
      errorCode: twilioResponse.errorCode,
      errorMessage: twilioResponse.errorMessage
    });

    if (twilioResponse.sid) {
      const deliveryStatus = mapTwilioStatusToDeliveryStatus(twilioResponse.status);

      // PHASE 3: Insert into database
      console.log("Inserting into database...");
      const insertQuery = `
        INSERT INTO whatsapp_chats
          (order_id, \`from\`, \`to\`, body, direction, message_type, 
           created_at, updated_at, delivery_status, is_read, twilio_sid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = (await pool.query(insertQuery, [
        orderId,
        "admin",
        orderId,
        messageData.content,
        "outbound",
        messageData.type,
        now,
        now,
        deliveryStatus,
        0,
        twilioResponse.sid,
      ])) as [{ insertId: number }, any];

      // PHASE 4: Create final message with real ID
      const finalMessage: Message = {
        ...optimisticMessage,
        id: result.insertId.toString(),
        delivery_status: deliveryStatus,
        twilio_sid: twilioResponse.sid,
      };

      // PHASE 5: Replace optimistic message with real message
      console.log("Broadcasting final message update to UI");
      emitMessageUpdate(orderId, tempId, finalMessage);

      return {
        success: true,
        message: finalMessage,
        twilioStatus: twilioResponse.status
      };

    } else {
      // Twilio rejected the message
      console.error("Twilio rejected message:", {
        errorCode: twilioResponse.errorCode,
        errorMessage: twilioResponse.errorMessage
      });

      const failedMessage: Message = {
        ...optimisticMessage,
        delivery_status: "failed",
        errorCode: twilioResponse.errorCode?.toString(),
        errorMessage: twilioResponse.errorMessage || undefined
      };

      emitMessageUpdate(orderId, tempId, failedMessage);

      return {
        success: false,
        error: twilioResponse.errorMessage || "Message rejected by Twilio",
        twilioStatus: "rejected"
      };
    }

  } catch (error: any) {
    console.error("sendMessage error:", error);

    // Update UI to show failure
    const failedMessage: Message = {
      ...optimisticMessage,
      delivery_status: "failed",
      errorMessage: error.message || "Failed to send message"
    };

    emitMessageUpdate(orderId, tempId, failedMessage);

    return {
      success: false,
      error: error.message || "Failed to send message",
      twilioStatus: "error"
    };
  }
};

/**
 * Webhook-driven status update from Twilio
 */
export const updateMessageDeliveryStatus = async (
  twilioSid: string, 
  newStatus: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const deliveryStatus = mapTwilioStatusToDeliveryStatus(newStatus);

    // Update database with updated_at timestamp
    const updateQuery = `
      UPDATE whatsapp_chats 
      SET delivery_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE twilio_sid = ?
    `;
    const [result] = (await pool.query(updateQuery, [deliveryStatus, twilioSid])) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0) {
      return { 
        success: false, 
        message: `No message found with Twilio SID: ${twilioSid}` 
      };
    }

    // Get message details to notify frontend
    const [rows] = (await pool.query(
      `SELECT order_id, id FROM whatsapp_chats WHERE twilio_sid = ? LIMIT 1`, 
      [twilioSid]
    )) as [{ order_id: string; id: number }[], any];

    if (rows.length > 0) {
      const { order_id, id } = rows[0];
      
      // Broadcast status update to frontend
      console.log(`Broadcasting status update for message ${id}: ${newStatus} → ${deliveryStatus}`);
      emitMessageStatusUpdate(order_id, id.toString(), {
        delivery_status: deliveryStatus
      });
    }

    console.log(`Updated message ${twilioSid}: ${newStatus} → ${deliveryStatus}`);
    return { 
      success: true, 
      message: "Delivery status updated successfully" 
    };

  } catch (error) {
    console.error("updateMessageDeliveryStatus error:", error);
    return { 
      success: false, 
      message: "Failed to update delivery status" 
    };
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  messageId: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const updateQuery = `
      UPDATE whatsapp_chats 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = (await pool.query(updateQuery, [messageId])) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0) {
      return { 
        success: false, 
        message: `No message found with ID: ${messageId}` 
      };
    }

    return { 
      success: true, 
      message: "Message marked as read successfully" 
    };
  } catch (error) {
    console.error("markMessageAsRead error:", error);
    return { 
      success: false, 
      message: "Failed to mark message as read" 
    };
  }
};

/**
 * Update unread count for messages in an order
 */
export const updateCustomerUnreadCount = async (
  orderId: string, 
  unreadCount: number
): Promise<{ status: "success" | "warning" | "error"; message: string; data?: any }> => {
  try {
    const query = `
      UPDATE whatsapp_chats 
      SET is_read = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE order_id = ?
    `;
    const [result] = (await pool.query(query, [unreadCount, orderId])) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0) {
      return { 
        status: "warning", 
        message: `No records found for order_id ${orderId}` 
      };
    }

    return { 
      status: "success", 
      message: "Unread count updated successfully", 
      data: { orderId, updatedRows: result.affectedRows } 
    };
  } catch (error) {
    console.error("updateCustomerUnreadCount error:", error);
    return { 
      status: "error", 
      message: "Failed to update unread count" 
    };
  }
};
/** Find order by phone number using the phone column */
const findOrderByPhone = async (phoneNumber: string): Promise<string | null> => {
  try {
    console.log(`🔍 Searching for order with phone number: ${phoneNumber}`);
    
    const [rows] = (await pool.query(
      `SELECT order_id FROM logistic_order WHERE phone = ? LIMIT 1`,
      [phoneNumber]
    )) as [Array<{ order_id: string }>, any];

    if (rows.length > 0) {
      console.log(`✅ Found order: ${rows[0].order_id} for phone: ${phoneNumber}`);
      return rows[0].order_id;
    }

    console.log(`❌ No order found for phone number: ${phoneNumber}`);
    return null;
  } catch (error) {
    console.error("Error finding order by phone:", error);
    throw error;
  }
};

// Normalize to your DB's `message_type` enum ('text' | 'file')
const toDbMessageType = (t: WhatsAppMessageType): "text" | "file" =>
  t === "text" ? "text" : "file";

/** Handle incoming WhatsApp message from Twilio webhook */
export const handleIncomingMessage = async (
  data: IncomingMessageData
): Promise<IncomingMessageResponse> => {
  const {
    twilioSid,
    phoneNumber,
    messageBody,
    messageType,
    profileName,
    smsStatus,
    waId,
    accountSid,
    mediaUrl,
    mediaContentType,
  } = data;

  try {
    console.log("📩 Processing incoming message:", {
      twilioSid,
      phoneNumber,
      messageType,
      bodyLength: messageBody?.length,
      waId,
      profileName,
      smsStatus,
      accountSid,
    });

    // 1) Find order
    const orderId = await findOrderByPhone(phoneNumber);
    if (!orderId) {
      return { success: false, error: `No order found for phone: ${phoneNumber}` };
    }
    console.log(`✅ Found order: ${orderId} for phone: ${phoneNumber}`);

    // 2) Build DB-safe values
    const dbMessageType = toDbMessageType(messageType);
    const bodyForSave =
      messageType === "text"
        ? (messageBody || "").trim()
        : (messageBody || `[${messageType}]`);

    const now = new Date();

    // 3) Save into DB
    const insertQuery = `
      INSERT INTO whatsapp_chats (
        order_id, twilio_sid, \`from\`, \`to\`, body, direction,
        message_type, delivery_status, is_read, created_at, updated_at,
        media_url, media_content_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = (await pool.query(insertQuery, [
      orderId,                    // order_id
      twilioSid,                  // twilio_sid
      phoneNumber,                // from
      "admin",                    // to
      bodyForSave,                // body
      "inbound",                  // direction
      dbMessageType,              // message_type -> 'text' | 'file'
      smsStatus || "received",    // delivery_status
      0,                          // is_read
      now,                        // created_at
      now,                        // updated_at
      mediaUrl || null,           // media_url
      mediaContentType || null,   // media_content_type
    ])) as [{ insertId: number }, any];

    if (!result.insertId) throw new Error("Failed to insert message into database");
    console.log(`💾 Message saved to DB with ID: ${result.insertId}`);

    // 4) Build message for frontend
    const newMessage: Message = {
      id: result.insertId.toString(),
      order_id: orderId,
      from: phoneNumber,
      to: "admin",
      body: bodyForSave,
      sender: phoneNumber,
      content: bodyForSave,
      direction: "inbound",
      message_type: dbMessageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivery_status: smsStatus || "received",
      is_read: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      type: messageType,
      twilio_sid: twilioSid,
      readAt: null,
      ...(dbMessageType === "file" && {
        fileName: `${messageType} file`,
        fileUrl: mediaUrl,
        fileType: mediaContentType,
      }),
    };

    // 5) Emit to UI
    try {
      emitMessageToOrder(orderId, newMessage);
      console.log(`📢 Message broadcasted to order: ${orderId}`);
    } catch (emitError) {
      console.error("Error emitting message to frontend:", emitError);
    }

    return { success: true, message: newMessage };
  } catch (error: any) {
    console.error("❌ Error processing incoming message:", error);
    return { success: false, error: error.message || "Failed to process incoming message" };
  }
};