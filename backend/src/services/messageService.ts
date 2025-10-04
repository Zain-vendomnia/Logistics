import pool from "../database";
import {
  emitMessageToOrder,
  emitMessageUpdate,
  emitMessageStatusUpdate,
  broadcastGlobalMessageStatus,
  updateGlobalUnreadCount,
} from "../socket";
import { handleNewMessage as handleCustomerListUpdate } from "./customerService";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

// ----------------------
// Types & Interfaces
// ----------------------

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

// ----------------------
// Helpers
// ----------------------

const mapTwilioStatusToDeliveryStatus = (s: string): string =>
  ({
    accepted: "pending",
    queued: "pending",
    sending: "sent",
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
    undelivered: "failed",
  }[s] ?? "pending");

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
    fileName: r.media_content_type
      ? `attachment.${r.media_content_type.split("/")[1] || "file"}`
      : "attachment",
  }),
});

const findOrderByPhone = async (phoneNumber: string): Promise<string | null> => {
  try {
    const [rows] = (await pool.query(
      `SELECT order_id FROM logistic_order WHERE phone=? LIMIT 1`,
      [phoneNumber]
    )) as [{ order_id: string }[], any];
    return rows.length > 0 ? rows[0].order_id : null;
  } catch (e) {
    console.error("Error finding order by phone:", e);
    throw e;
  }
};

// ----------------------
// Message CRUD
// ----------------------

export const getMessagesByOrderId = async (orderId: string): Promise<Message[]> => {
  try {
    const [rows] = (await pool.query(
      `SELECT * FROM whatsapp_chats WHERE order_id=? ORDER BY created_at ASC`,
      [orderId]
    )) as [DBRow[], any];
    return rows.map(mapDbRowToMessage);
  } catch (e) {
    console.error("getMessagesByOrderId error:", e);
    throw e;
  }
};

export const sendMessage = async (
  orderId: string,
  d: MessageRequest
): Promise<SendMessageResponse> => {
  const now = new Date();
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const opt: Message = {
    id: tempId,
    order_id: orderId,
    from: "admin",
    to: orderId,
    body: d.content,
    sender: "You",
    content: d.content,
    direction: "outbound",
    message_type: d.type,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    delivery_status: "sending",
    is_read: 0,
    timestamp: now.toISOString(),
    type: d.type === "file" ? "document" : "text",
    twilio_sid: null,
    readAt: null,
    ...(d.fileName && { fileName: d.fileName }),
    ...(d.fileUrl && { fileUrl: d.fileUrl }),
    ...(d.fileType && { fileType: d.fileType }),
  };

  try {
    emitMessageToOrder(orderId, opt);

    const twilioMsg =
      d.type === "file" && d.fileUrl
        ? { from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, to: `whatsapp:${d.phone_number}`, mediaUrl: [d.fileUrl] }
        : { body: d.content, from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, to: `whatsapp:${d.phone_number}` };

    const twilioRes = await client.messages.create(twilioMsg);

    if (twilioRes.sid) {
      const ds = mapTwilioStatusToDeliveryStatus(twilioRes.status);
      const [result] = (await pool.query(
        `INSERT INTO whatsapp_chats(order_id,\`from\`,\`to\`,body,direction,message_type,created_at,updated_at,delivery_status,is_read,twilio_sid,media_url,media_content_type)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [orderId, "admin", orderId, d.content, "outbound", d.type, now, now, ds, 0, twilioRes.sid, d.fileUrl || null, d.fileType || null]
      )) as [{ insertId: number }, any];

      const final = { ...opt, id: result.insertId.toString(), delivery_status: ds, twilio_sid: twilioRes.sid };
      emitMessageUpdate(orderId, tempId, final);
      await handleCustomerListUpdate(final, orderId);

      return { success: true, message: final, twilioStatus: twilioRes.status };
    }

    const failed = { ...opt, delivery_status: "failed" };
    emitMessageUpdate(orderId, tempId, failed);
    return { success: false, error: "Message rejected by Twilio" };
  } catch (e: any) {
    const failed = { ...opt, delivery_status: "failed" };
    emitMessageUpdate(orderId, tempId, failed);
    return { success: false, error: e.message || "Failed to send message" };
  }
};

// ----------------------
// Status Updates
// ----------------------

export const updateMessageDeliveryStatus = async (
  twilioSid: string,
  newStatus: string,
  errorCode?: string,
  errorMessage?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const ds = mapTwilioStatusToDeliveryStatus(newStatus);
    const [result] = (await pool.query(
      `UPDATE whatsapp_chats SET delivery_status=?,error_code=?,error_message=?,updated_at=CURRENT_TIMESTAMP WHERE twilio_sid=?`,
      [ds, errorCode, errorMessage, twilioSid]
    )) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0)
      return { success: false, message: `No message found with Twilio SID: ${twilioSid}` };

    const [rows] = (await pool.query(
      `SELECT order_id,id FROM whatsapp_chats WHERE twilio_sid=? LIMIT 1`,
      [twilioSid]
    )) as [{ order_id: string; id: number }[], any];

    if (rows.length > 0) {
      const { order_id, id } = rows[0];
      emitMessageStatusUpdate(order_id, id.toString(), { delivery_status: ds });
      broadcastGlobalMessageStatus(id.toString(), parseInt(order_id), ds);
    }

    return { success: true, message: "Delivery status updated successfully" };
  } catch (e) {
    console.error("updateMessageDeliveryStatus error:", e);
    return { success: false, message: "Failed to update delivery status" };
  }
};

// ----------------------
// Unread Count
// ----------------------

export const updateCustomerUnreadCount = async (
  orderId: string,
  unreadCount: number
): Promise<{ status: "success" | "error"; message: string; data?: any }> => {
  try {
    console.log(`Updating unread count for order ${orderId}: ${unreadCount}`);

    if (unreadCount === 0) {
      const [result] = (await pool.query(
        `UPDATE whatsapp_chats SET is_read=1,read_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP 
         WHERE order_id=? AND direction='inbound' AND is_read=0`,
        [orderId]
      )) as [{ affectedRows: number }, any];

      console.log(`Marked ${result.affectedRows} messages as read for order ${orderId}`);
      await updateGlobalUnreadCount();

      const [latest] = (await pool.query(
        `SELECT * FROM whatsapp_chats WHERE order_id=? ORDER BY created_at DESC LIMIT 1`,
        [orderId]
      )) as [DBRow[], any];

      if (latest.length > 0) {
        const msg = mapDbRowToMessage(latest[0]);
        await handleCustomerListUpdate(msg, orderId);
      }

      return { status: "success", message: "Messages marked as read", data: { orderId, updatedRows: result.affectedRows } };
    }

    return { status: "success", message: "Unread count processed", data: { orderId, unreadCount } };
  } catch (e) {
    console.error("updateCustomerUnreadCount error:", e);
    return { status: "error", message: "Failed to update unread count" };
  }
};

// ----------------------
// Incoming Messages
// ----------------------

export const handleIncomingMessage = async (
  d: IncomingMessageData
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  const { twilioSid, phoneNumber, messageBody, messageType, smsStatus, mediaUrl, mediaContentType, fileName, fileType } = d;

  try {
    console.log(`Processing incoming message from ${phoneNumber}:`, messageType);

    const orderId = await findOrderByPhone(phoneNumber);
    if (!orderId) return { success: false, error: `No order found for phone: ${phoneNumber}` };

    const dbMsgType = messageType === "text" ? "text" : "file";
    const bodyForSave = messageType === "text" ? (messageBody || "").trim() : messageBody || `[${messageType}]`;
    const now = new Date();

    const [result] = (await pool.query(
      `INSERT INTO whatsapp_chats(order_id,twilio_sid,\`from\`,\`to\`,body,direction,message_type,delivery_status,is_read,created_at,updated_at,media_url,media_content_type)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderId, twilioSid, phoneNumber, "admin", bodyForSave, "inbound", dbMsgType, smsStatus || "received", 0, now, now, mediaUrl || null, mediaContentType || null]
    )) as [{ insertId: number }, any];

    if (!result.insertId) throw new Error("Failed to insert message");

    console.log(`New inbound message saved with ID: ${result.insertId}`);
    console.log(`Updating global unread count after new inbound message...`);
    await updateGlobalUnreadCount();

    const newMsg: Message = {
      id: result.insertId.toString(),
      order_id: orderId,
      from: phoneNumber,
      to: "admin",
      body: bodyForSave,
      sender: phoneNumber,
      content: bodyForSave,
      direction: "inbound",
      message_type: dbMsgType,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      delivery_status: smsStatus || "received",
      is_read: 0,
      timestamp: now.toISOString(),
      type: messageType,
      twilio_sid: twilioSid,
      readAt: null,
      ...(dbMsgType === "file" && { fileName: fileName || `${messageType} file`, fileUrl: mediaUrl, fileType: mediaContentType || fileType }),
    };

    emitMessageToOrder(orderId, newMsg);
    await handleCustomerListUpdate(newMsg, orderId);

    console.log(`Successfully processed incoming message for order ${orderId}`);
    return { success: true, message: newMsg };
  } catch (e: any) {
    console.error("Error processing incoming message:", e);
    return { success: false, error: e.message || "Failed to process incoming message" };
  }
};
