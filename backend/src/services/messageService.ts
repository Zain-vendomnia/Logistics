import pool from "../database";
import { 
  emitMessageToOrder, 
  emitMessageUpdate, 
  emitMessageStatusUpdate,
  broadcastGlobalMessageStatus,
  updateTotalUnreadCount,
  setTotalUnreadCount,
} from "../socket";
import { handleNewMessage as handleCustomerListUpdate } from "./customerService";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

export type WhatsAppMessageType = "text" | "image" | "video" | "audio" | "document" | "location" | "contacts" | "sticker" | "unknown";

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
  fileUrl?: string;
  fileType?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
  twilioStatus?: string;
}

export interface IncomingMessageData {
  twilioSid: string;
  phoneNumber: string;
  messageBody: string;
  messageType: WhatsAppMessageType;
  profileName?: string;
  smsStatus?: string;
  mediaUrl?: string;
  mediaContentType?: string;
  fileName?: string;
  fileType?: string;
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

const mapTwilioStatusToDeliveryStatus = (twilioStatus: string): string => {
  const map: Record<string, string> = {
    accepted: "pending", queued: "pending", sending: "sent",
    sent: "sent", delivered: "delivered", read: "read",
    failed: "failed", undelivered: "failed",
  };
  return map[twilioStatus] ?? "pending";
};

const mapDbRowToMessage = (r: DBRow): Message => ({
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
  timestamp: r.created_at.toISOString(),
  type: (r.message_type === "file" ? "document" : "text") as WhatsAppMessageType,
  twilio_sid: r.twilio_sid,
  fileUrl: r.media_url ?? undefined,
  fileType: r.media_content_type ?? undefined,
  errorCode: r.error_code ?? undefined,
  errorMessage: r.error_message ?? undefined,
  readAt: r.read_at?.toISOString() ?? null,
  ...(r.message_type === "file" && { 
    fileName: r.media_content_type ? `attachment.${r.media_content_type.split('/')[1] || 'file'}` : "attachment"
  }),
});

// NEW: Get total unread messages count from database
export const getTotalUnreadCountFromDB = async (): Promise<number> => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total_unread FROM whatsapp_chats WHERE direction = 'inbound' AND is_read = 0`
    ) as [{ total_unread: number }[], any];
    return rows[0]?.total_unread || 0;
  } catch (error) {
    console.error("getTotalUnreadCountFromDB error:", error);
    return 0;
  }
};

// NEW: Initialize total unread count on server start
export const initializeTotalUnreadCount = async (): Promise<void> => {
  try {
    const totalUnread = await getTotalUnreadCountFromDB();
    setTotalUnreadCount(totalUnread);
    console.log(`Initialized total unread count: ${totalUnread}`);
  } catch (error) {
    console.error("Failed to initialize total unread count:", error);
  }
};

export const getMessagesByOrderId = async (orderId: string): Promise<Message[]> => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM whatsapp_chats WHERE order_id = ? ORDER BY created_at ASC`,
      [orderId]
    ) as [DBRow[], any];
    return rows.map(mapDbRowToMessage);
  } catch (err) {
    console.error("getMessagesByOrderId error:", err);
    throw err;
  }
};

export const sendMessage = async (
  orderId: string,
  messageData: MessageRequest
): Promise<SendMessageResponse> => {
  const now = new Date();
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
    delivery_status: "sending",
    is_read: 0,
    timestamp: now.toISOString(),
    type: messageData.type === "file" ? "document" : "text",
    twilio_sid: null,
    readAt: null,
    ...(messageData.fileName && { fileName: messageData.fileName }),
    ...(messageData.fileUrl && { fileUrl: messageData.fileUrl }),
    ...(messageData.fileType && { fileType: messageData.fileType }),
  };

  try {
    // Send optimistic message
    emitMessageToOrder(orderId, optimisticMessage);

    // Send via Twilio
    const twilioMessage = messageData.type === "file" && messageData.fileUrl
      ? { from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, to: `whatsapp:${messageData.phone_number}`, mediaUrl: [messageData.fileUrl] }
      : { body: messageData.content, from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, to: `whatsapp:${messageData.phone_number}` };
    
    const twilioResponse = await client.messages.create(twilioMessage);

    if (twilioResponse.sid) {
      const deliveryStatus = mapTwilioStatusToDeliveryStatus(twilioResponse.status);

      // Insert into database
      const [result] = await pool.query(
        `INSERT INTO whatsapp_chats (order_id, \`from\`, \`to\`, body, direction, message_type, 
         created_at, updated_at, delivery_status, is_read, twilio_sid, media_url, media_content_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, "admin", orderId, messageData.content, "outbound", messageData.type,
         now, now, deliveryStatus, 0, twilioResponse.sid,
         messageData.fileUrl || null, messageData.fileType || null]
      ) as [{ insertId: number }, any];

      const finalMessage = { ...optimisticMessage, id: result.insertId.toString(), delivery_status: deliveryStatus, twilio_sid: twilioResponse.sid };
      
      emitMessageUpdate(orderId, tempId, finalMessage);
      await handleCustomerListUpdate(finalMessage, orderId);

      return { success: true, message: finalMessage, twilioStatus: twilioResponse.status };
    }

    const failedMessage = { ...optimisticMessage, delivery_status: "failed" };
    emitMessageUpdate(orderId, tempId, failedMessage);
    return { success: false, error: "Message rejected by Twilio" };

  } catch (error: any) {
    const failedMessage = { ...optimisticMessage, delivery_status: "failed" };
    emitMessageUpdate(orderId, tempId, failedMessage);
    return { success: false, error: error.message || "Failed to send message" };
  }
};

export const updateMessageDeliveryStatus = async (
  twilioSid: string, 
  newStatus: string,
  errorCode?: string,
  errorMessage?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const deliveryStatus = mapTwilioStatusToDeliveryStatus(newStatus);

    const [result] = await pool.query(
      `UPDATE whatsapp_chats SET delivery_status = ?, error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE twilio_sid = ?`,
      [deliveryStatus, errorCode, errorMessage, twilioSid]
    ) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0) {
      return { success: false, message: `No message found with Twilio SID: ${twilioSid}` };
    }

    const [rows] = await pool.query(
      `SELECT order_id, id FROM whatsapp_chats WHERE twilio_sid = ? LIMIT 1`,
      [twilioSid]
    ) as [{ order_id: string; id: number }[], any];

    if (rows.length > 0) {
      const { order_id, id } = rows[0];
      emitMessageStatusUpdate(order_id, id.toString(), { delivery_status: deliveryStatus });
      broadcastGlobalMessageStatus(id.toString(), parseInt(order_id), deliveryStatus);
    }

    return { success: true, message: "Delivery status updated successfully" };
  } catch (error) {
    console.error("updateMessageDeliveryStatus error:", error);
    return { success: false, message: "Failed to update delivery status" };
  }
};

export const updateCustomerUnreadCount = async (
  orderId: string, 
  unreadCount: number
): Promise<{ status: "success" | "error"; message: string; data?: any }> => {
  try {
    if (unreadCount === 0) {
      // Get count of unread messages before marking as read
      const [unreadRows] = await pool.query(
        `SELECT COUNT(*) as unread_count FROM whatsapp_chats 
         WHERE order_id = ? AND direction = 'inbound' AND is_read = 0`,
        [orderId]
      ) as [{ unread_count: number }[], any];
      
      const previousUnreadCount = unreadRows[0]?.unread_count || 0;

      const [result] = await pool.query(
        `UPDATE whatsapp_chats SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE order_id = ? AND direction = 'inbound' AND is_read = 0`,
        [orderId]
      ) as [{ affectedRows: number }, any];

      // Decrease total unread count by the number of messages marked as read
      if (previousUnreadCount > 0) {
        updateTotalUnreadCount(-previousUnreadCount);
      }

      // Trigger customer list update
      const [latestMessage] = await pool.query(
        `SELECT * FROM whatsapp_chats WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
        [orderId]
      ) as [DBRow[], any];

      if (latestMessage.length > 0) {
        const message = mapDbRowToMessage(latestMessage[0]);
        await handleCustomerListUpdate(message, orderId);
      }

      return { status: "success", message: "Messages marked as read", data: { orderId, updatedRows: result.affectedRows } };
    }
    return { status: "success", message: "Unread count processed", data: { orderId, unreadCount } };
  } catch (error) {
    console.error("updateCustomerUnreadCount error:", error);
    return { status: "error", message: "Failed to update unread count" };
  }
};

const findOrderByPhone = async (phoneNumber: string): Promise<string | null> => {
  try {
    const [rows] = await pool.query(
      `SELECT order_id FROM logistic_order WHERE phone = ? LIMIT 1`,
      [phoneNumber]
    ) as [{ order_id: string }[], any];
    return rows.length > 0 ? rows[0].order_id : null;
  } catch (error) {
    console.error("Error finding order by phone:", error);
    throw error;
  }
};

export const handleIncomingMessage = async (data: IncomingMessageData): Promise<{ success: boolean; message?: Message; error?: string }> => {
  const { twilioSid, phoneNumber, messageBody, messageType, smsStatus, mediaUrl, mediaContentType, fileName, fileType } = data;

  try {
    const orderId = await findOrderByPhone(phoneNumber);
    if (!orderId) return { success: false, error: `No order found for phone: ${phoneNumber}` };

    const dbMessageType = messageType === "text" ? "text" : "file";
    const bodyForSave = messageType === "text" ? (messageBody || "").trim() : (messageBody || `[${messageType}]`);
    const now = new Date();

    const [result] = await pool.query(
      `INSERT INTO whatsapp_chats (order_id, twilio_sid, \`from\`, \`to\`, body, direction,
       message_type, delivery_status, is_read, created_at, updated_at, media_url, media_content_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, twilioSid, phoneNumber, "admin", bodyForSave, "inbound",
       dbMessageType, smsStatus || "received", 0, now, now, mediaUrl || null, mediaContentType || null]
    ) as [{ insertId: number }, any];

    if (!result.insertId) throw new Error("Failed to insert message");

    // Increment total unread count for new inbound message
    updateTotalUnreadCount(1);

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
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      delivery_status: smsStatus || "received",
      is_read: 0,
      timestamp: now.toISOString(),
      type: messageType,
      twilio_sid: twilioSid,
      readAt: null,
      ...(dbMessageType === "file" && {
        fileName: fileName || `${messageType} file`,
        fileUrl: mediaUrl,
        fileType: mediaContentType || fileType,
      }),
    };

    emitMessageToOrder(orderId, newMessage);
    await handleCustomerListUpdate(newMessage, orderId);

    return { success: true, message: newMessage };
  } catch (error: any) {
    console.error("Error processing incoming message:", error);
    return { success: false, error: error.message || "Failed to process incoming message" };
  }
};

// NEW: Sync total unread count with database (call this periodically or on demand)
export const syncTotalUnreadCount = async (): Promise<void> => {
  try {
    const totalUnread = await getTotalUnreadCountFromDB();
    setTotalUnreadCount(totalUnread);
  } catch (error) {
    console.error("Failed to sync total unread count:", error);
  }
};