import pool from "../config/database";
import twilioService from "./twilioService";
import {
  emitMessageToOrder,
  updateGlobalUnreadCount,
  handleMessageRead,
  broadcastOutboundMessage,
} from "../socket/communication.socket";

interface Message {
  from: string;
  to: string;
  message: string;
  message_type: string;
  communication_channel: "whatsapp" | "sms" | "email";
  media_url?: string | null;
  media_content_type?: string | null;
  is_read: boolean;
  direction: "inbound" | "outbound";
  message_id: string;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  read_at?: string | null;
  send_user_id?: number;
  status?: string;
}

interface ConversationData {
  order_id: number;
  messages: Message[];
  last_channel: "whatsapp" | "sms" | "email" | null;
  unread_count: number;
  customerInfo?: CustomerInfo;
}

interface SendMessageParams {
  orderId: number;
  message: string;
  message_type: string;
  media_url?: string;
  media_content_type?: string;
  userId: number;
}

interface CustomerInfo {
  phone: string;
  email: string;
  name: string;
}

/**
 * Get customer info from logistic_order table
 */
const getCustomerInfo = async (orderId: number): Promise<CustomerInfo> => {
  try {
    console.log(`👤 Fetching customer info for order: ${orderId}`);

    const query = `
      SELECT phone, email, concat(firstname , ' ', lastname) as name
      FROM logistic_order
      WHERE order_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [orderId]) as [any[], any];

    if (rows.length === 0) {
      throw new Error(`Customer not found for order ${orderId}`);
    }

    console.log(`✅ Customer info retrieved for order ${orderId}`);
    return rows[0];
  } catch (error) {
    console.error(`❌ Error fetching customer info for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get conversation by order ID
 */
export const getConversationByOrderId = async (
  orderId: number,
  includeCustomerInfo: boolean = false
): Promise<ConversationData> => {
  try {
    console.log(`🔍 Fetching conversation for order: ${orderId}`);

    const query = `
      SELECT 
        order_id,
        convo,
        convo_is_read,
        created_at,
        updated_at
      FROM customer_chats
      WHERE order_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [orderId]) as [any[], any];

    console.log(`📊 Query result: Found ${rows.length} conversation(s)`);

    let customerInfo: CustomerInfo | undefined;
    if (includeCustomerInfo) {
      try {
        customerInfo = await getCustomerInfo(orderId);
      } catch (error) {
        console.warn(`⚠️ Could not fetch customer info for order ${orderId}`);
      }
    }

    if (rows.length === 0) {
      console.log(`ℹ️ No conversation exists for order ${orderId}, returning empty`);
      return {
        order_id: orderId,
        messages: [],
        last_channel: null,
        unread_count: 0,
        customerInfo,
      };
    }

    const row = rows[0];
    let messages: Message[] = [];
    
    if (row.convo) {
      try {
        if (typeof row.convo === 'string') {
          console.log(`🔄 Parsing convo string for order ${orderId}`);
          messages = JSON.parse(row.convo);
        } else if (typeof row.convo === 'object') {
          console.log(`✅ Convo already object for order ${orderId}`);
          messages = row.convo;
        }
      } catch (jsonError) {
        console.error(`❌ JSON parse error for order ${orderId}:`, jsonError);
        console.error(`📄 Invalid JSON content:`, row.convo);
        throw new Error(`Invalid conversation data format for order ${orderId}`);
      }
    }

    const lastMessage = messages.length > 0 
      ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null;

    const lastChannel = lastMessage?.communication_channel || null;
    const unreadCount = messages.filter(m => m.direction === "inbound" && !m.is_read).length;

    console.log(`✅ Successfully retrieved conversation for order ${orderId} | Messages: ${messages.length} | Unread: ${unreadCount}`);

    return {
      order_id: orderId,
      messages,
      last_channel: lastChannel,
      unread_count: unreadCount,
      customerInfo,
    };
  } catch (error) {
    console.error(`❌ Error in getConversationByOrderId for order ${orderId}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('ER_NO_SUCH_TABLE')) {
        throw new Error('Database table "customer_chats" does not exist');
      } else if (error.message.includes('ER_BAD_FIELD_ERROR')) {
        throw new Error('Invalid column name in customer_chats table');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Database connection refused');
      }
    }
    
    throw new Error(error instanceof Error ? error.message : "Failed to fetch conversation from database");
  }
};

/**
 * Detect which channel to use
 */
const detectChannel = (messages: Message[]): "whatsapp" | "sms" | "email" => {
  const lastInboundMessage = messages
    .filter(m => m.direction === "inbound")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (lastInboundMessage) {
    return lastInboundMessage.communication_channel;
  }

  const lastOutboundMessage = messages
    .filter(m => m.direction === "outbound")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return lastOutboundMessage?.communication_channel || "whatsapp";
};

/**
 * Send message to customer
 */
export const sendMessageToCustomer = async (params: SendMessageParams) => {
  try {
    const { orderId, message, message_type, media_url, media_content_type, userId } = params;

    console.log(`📤 Sending message to customer | Order: ${orderId}`);

    const customerInfo = await getCustomerInfo(orderId);
    const conversation = await getConversationByOrderId(orderId);
    const channel = conversation.last_channel || detectChannel(conversation.messages);

    console.log(`📡 Using channel: ${channel} for order ${orderId}`);

    const newMessage: Message = {
      from: "",
      to: channel === "email" ? customerInfo.email : customerInfo.phone,
      message,
      message_type,
      communication_channel: channel,
      media_url: media_url || null,
      media_content_type: media_content_type || null,
      is_read: false,
      direction: "outbound",
      message_id: "",
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString(),
      read_at: null,
      send_user_id: userId,
    };

    // Send via Twilio based on channel - using object params
    let twilioResult;
    switch (channel) {
      case "whatsapp":
        twilioResult = await twilioService.sendWhatsApp({
          to: customerInfo.phone,
          body: message,
          mediaUrl: media_url,
        });
        break;
      case "sms":
        twilioResult = await twilioService.sendSMS({
          to: customerInfo.phone,
          body: message,
          mediaUrl: media_url,
        });
        break;
      case "email":
        twilioResult = await twilioService.sendEmail({
          to: customerInfo.email,
          subject: `Order ${orderId} Update`,
          body: message,
        });
        break;
      default:
        throw new Error("Invalid communication channel");
    }

    // Update message with Twilio response
    newMessage.from = twilioResult.from;
    newMessage.message_id = twilioResult.sid;
    newMessage.status = twilioResult.status || "sent";

    if (twilioResult.error) {
      newMessage.error_code = twilioResult.errorCode;
      newMessage.error_message = twilioResult.error;
    }

    // Mark all previous inbound messages as read
    const updatedPreviousMessages = conversation.messages.map(msg => {
      if (msg.direction === "inbound" && !msg.is_read) {
        return { ...msg, is_read: true, read_at: new Date().toISOString() };
      }
      return msg;
    });

    const updatedMessages = [...updatedPreviousMessages, newMessage];
    const isFirstMessage = conversation.messages.length === 0;

    await saveConversation(orderId, updatedMessages, true, isFirstMessage);
    await updateGlobalUnreadCount();

    // Broadcast via WebSocket to order room
    emitMessageToOrder(orderId.toString(), newMessage);

    // Broadcast customer reorder event for outbound messages
    await broadcastOutboundMessage(orderId, newMessage, customerInfo);

    console.log(`✅ Message sent successfully | Order: ${orderId} | Channel: ${channel}`);

    return {
      success: true,
      data: {
        message: newMessage,
        channel,
      },
    };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
};

/**
 * Save conversation to database
 */
const saveConversation = async (
  orderId: number,
  messages: Message[],
  convoIsRead: boolean = false,
  isInsert: boolean = false
) => {
  try {
    const convoJson = JSON.stringify(messages);
    const isReadValue = convoIsRead ? 1 : 0;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    if (isInsert) {
      const insertQuery = `
        INSERT INTO customer_chats 
        (order_id, convo, convo_is_read, last_message, last_message_at, last_communication_channel, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())
      `;
      await pool.query(insertQuery, [
        orderId,
        convoJson,
        isReadValue,
        lastMessage?.message || null,
        lastMessage?.communication_channel || 'none'
      ]);
      console.log(`📝 Created new conversation | Order: ${orderId}`);
    } else {
      const updateQuery = `
        UPDATE customer_chats 
        SET convo = ?, 
            convo_is_read = ?,
            last_message = ?,
            last_message_at = NOW(),
            last_communication_channel = ?,
            updated_at = NOW()
        WHERE order_id = ?
      `;
      await pool.query(updateQuery, [
        convoJson,
        isReadValue,
        lastMessage?.message || null,
        lastMessage?.communication_channel || 'none',
        orderId
      ]);
      console.log(`📝 Updated conversation | Order: ${orderId}`);
    }
  } catch (error) {
    console.error(`❌ Error saving conversation for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Receive message from Twilio webhook (inbound)
 */
export const receiveInboundMessage = async (orderId: number, message: any) => {
  try {
    console.log(`📥 Receiving inbound message | Order: ${orderId} | Channel: ${message.communication_channel}`);

    const conversation = await getConversationByOrderId(orderId);
    const updatedMessages = [...conversation.messages, message];
    const isFirstMessage = conversation.messages.length === 0;

    await saveConversation(orderId, updatedMessages, false, isFirstMessage);
    await updateGlobalUnreadCount();
    emitMessageToOrder(orderId.toString(), message);

    console.log(`✅ Inbound message saved | Order: ${orderId}`);

    return { success: true, conversation: updatedMessages };
  } catch (error) {
    console.error("❌ Error receiving inbound message:", error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (orderId: number) => {
  try {
    console.log(`✅ Marking messages as read | Order: ${orderId}`);

    const conversation = await getConversationByOrderId(orderId);

    const unreadCount = conversation.messages.filter(
      msg => msg.direction === "inbound" && !msg.is_read
    ).length;

    if (unreadCount === 0) {
      console.log(`ℹ️ No unread messages to mark | Order: ${orderId}`);
      return { success: true, markedCount: 0 };
    }

    const updatedMessages = conversation.messages.map(msg => {
      if (msg.direction === "inbound" && !msg.is_read) {
        return { ...msg, is_read: true, read_at: new Date().toISOString() };
      }
      return msg;
    });

    await saveConversation(orderId, updatedMessages, true, false);
    await handleMessageRead(orderId, unreadCount);
    await updateGlobalUnreadCount();

    console.log(`✅ Marked ${unreadCount} messages as read | Order: ${orderId}`);

    return { success: true, markedCount: unreadCount };
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return { success: false, markedCount: 0 };
  }
};

/**
 * Update message status by message ID
 */
export const updateMessageStatusById = async (
  orderId: number,
  messageId: string,
  status: string,
  errorCode?: string | null,
  errorMessage?: string | null
) => {
  try {
    const conversation = await getConversationByOrderId(orderId);

    const idx = conversation.messages.findIndex(msg => msg.message_id === messageId);

    if (idx === -1) {
      console.log(`⚠️ Message not found | Order: ${orderId} | MessageID: ${messageId}`);
      return false;
    }

    const message = conversation.messages[idx];

    message.status = status.toLowerCase();

    if (status.toLowerCase() === 'read') {
      message.is_read = true;
      message.read_at = new Date().toISOString();
    }

    if (status.toLowerCase() === 'delivered') {
      message.is_read = false;
      message.read_at = null;
    }

    if (errorCode) {
      message.error_code = errorCode;
      message.error_message = errorMessage || null;
      message.status = 'failed';
    }

    await saveConversation(orderId, conversation.messages, true, false);

    console.log(`✅ Message status updated | Order: ${orderId} | MessageID: ${messageId} | Status: ${message.status}`);
    
    return true;
  } catch (err) {
    console.error(`❌ updateMessageStatusById error | Order: ${orderId} | MessageID: ${messageId}`, err);
    throw err;
  }
};