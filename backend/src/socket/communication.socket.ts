import { Socket } from "socket.io";
import pool from "../config/database";
import {
  getIO,
  emitToRoom,
} from "../config/socket";
import { getConversationByOrderId } from "../services/communicationService";

// Track admin connections
const adminConnections = new Set<string>();
let globalUnreadCount = 0;

/**
 * Get actual unread count from database
 */
const getActualUnreadCountFromDB = async (): Promise<number> => {
  try {
    const [rows] = (await pool.query(
      `SELECT COUNT(*) as total_unread FROM customer_chats WHERE convo_is_read = 0`
    )) as [{ total_unread: number }[], any];
    return rows[0]?.total_unread || 0;
  } catch (e) {
    console.error("❌ Error getting unread count:", e);
    return 0;
  }
};

/**
 * Initialize global unread count from database
 */
const initializeGlobalUnreadCount = async () => {
  try {
    globalUnreadCount = await getActualUnreadCountFromDB();
    console.log(`✅ Initialized global unread count: ${globalUnreadCount}`);
  } catch (e) {
    console.error("❌ Error initializing unread count:", e);
    globalUnreadCount = 0;
  }
};

/**
 * Initialize Communication socket event handlers
 */
export const initCommunicationSocket = () => {
  const io = getIO();

  // Initialize unread count on startup
  initializeGlobalUnreadCount();

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | Role: ${socket.userRole}`);

    /* =================================================================
       EVENT 1: JOIN ADMIN ROOM
    ================================================================= */
    socket.on("admin:join", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        socket.join("admin-room");
        adminConnections.add(socket.id);
        globalUnreadCount = await getActualUnreadCountFromDB();

        const timestamp = new Date().toISOString();

        socket.emit("unread:count", {
          totalUnreadCount: globalUnreadCount,
          timestamp,
        });

        socket.emit("admin:joined", {
          socketId: socket.id,
          timestamp,
        });

        console.log(`✅ Admin ${socket.id} joined admin-room | Unread: ${globalUnreadCount}`);
      } else {
        socket.emit("error", { message: "Unauthorized: Admin access required" });
      }
    });

    /* =================================================================
       EVENT 2: LEAVE ADMIN ROOM
    ================================================================= */
    socket.on("admin:leave", () => {
      socket.leave("admin-room");
      adminConnections.delete(socket.id);
      console.log(`🚪 Admin ${socket.id} left admin-room`);
    });

    /* =================================================================
       EVENT 3: GET UNREAD COUNT
    ================================================================= */
    socket.on("unread:get-count", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        globalUnreadCount = await getActualUnreadCountFromDB();

        socket.emit("unread:count", {
          totalUnreadCount: globalUnreadCount,
          timestamp: new Date().toISOString(),
        });

        console.log(`📊 Unread count sent to ${socket.id}: ${globalUnreadCount}`);
      }
    });

    /* =================================================================
       EVENT 4: JOIN SPECIFIC CUSTOMER CHAT
    ================================================================= */
    socket.on("customer:join", (orderId: string) => {
      if (orderId) {
        socket.join(`order-${orderId}`);
        console.log(`📥 Socket ${socket.id} joined order-${orderId}`);
      }
    });

    /* =================================================================
       EVENT 5: LEAVE SPECIFIC CUSTOMER CHAT
    ================================================================= */
    socket.on("customer:leave", (orderId: string) => {
      if (orderId) {
        socket.leave(`order-${orderId}`);
        console.log(`📤 Socket ${socket.id} left order-${orderId}`);
      }
    });

    /* =================================================================
       EVENT 6: GET SINGLE CUSTOMER MESSAGES
    ================================================================= */
    socket.on("customer:get-messages", async (data: { orderId: number }) => {
      try {
        if (socket.userRole !== "admin" && socket.userRole !== "support") {
          return socket.emit("error", { message: "Unauthorized" });
        }

        const { orderId } = data;
        if (!orderId) {
          return socket.emit("error", { message: "Missing orderId" });
        }

        const conversation = await getConversationByOrderId(orderId, true);

        socket.emit("customer:messages", {
          orderId,
          messages: conversation.messages,
          customerInfo: conversation.customerInfo,
          timestamp: new Date().toISOString(),
        });

        console.log(`💬 Messages sent for order ${orderId} | Count: ${conversation.messages.length}`);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
        socket.emit("error", { message: "Failed to fetch messages" });
      }
    });

    /* =================================================================
       EVENT 7: GET MESSAGE STATUS
    ================================================================= */
    socket.on("message:get-status", async (data: { messageId: string; orderId: number }) => {
      try {
        const { messageId, orderId } = data;

        if (!messageId || !orderId) {
          return socket.emit("message:status-error", {
            messageId,
            error: "Missing messageId or orderId",
          });
        }

        const conversation = await getConversationByOrderId(orderId, false);
        const message = conversation.messages.find((m) => m.message_id === messageId);

        if (message) {
          socket.emit("message:status", {
            messageId,
            orderId,
            status: message.status || "sent",
            is_read: message.is_read,
            read_at: message.read_at,
            communication_channel: message.communication_channel,
            direction: message.direction,
            timestamp: new Date().toISOString(),
          });

          console.log(`✅ Message status sent | MessageID: ${messageId} | Status: ${message.status}`);
        } else {
          socket.emit("message:status-error", {
            messageId,
            orderId,
            error: "Message not found",
          });

          console.warn(`⚠️ Message not found | MessageID: ${messageId} | Order: ${orderId}`);
        }
      } catch (err) {
        console.error("❌ Error fetching message status:", err);
        socket.emit("message:status-error", {
          messageId: data.messageId,
          orderId: data.orderId,
          error: "Failed to fetch status",
        });
      }
    });

    /* =================================================================
       DISCONNECT HANDLER
    ================================================================= */
    socket.on("disconnect", () => {
      adminConnections.delete(socket.id);
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

/* =================================================================
   BROADCAST FUNCTIONS (Server-side triggers)
================================================================= */

/**
 * Broadcast new message to specific customer room
 */
export const emitMessageToOrder = (orderId: string, message: any) => {
  console.log(`📤 Emitting message to order-${orderId} | Channel: ${message.communication_channel}`);
  
  emitToRoom(`order-${orderId}`, "message:new", {
    message: {
      id: message.message_id,
      content: message.message,
      timestamp: message.created_at,
      direction: message.direction,
      type: message.message_type,
      communication_channel: message.communication_channel,
      status: message.status,
      is_read: message.is_read,
      fileName: message.fileName,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast customer update to all admins (for customer list updates)
 */
export const broadcastCustomerUpdate = (
  orderId: number,
  message: any,
  custInfo: any,
  unreadCount: number
) => {
  console.log(`🔔 Broadcasting customer update | Order: ${orderId} | Channel: ${message.communication_channel}`);

  emitToRoom("admin-room", "customer:updated", {
    orderId,
    customerName: custInfo.name,
    customerPhone: custInfo.phone,
    customerEmail: custInfo.email,
    lastMessage: {
      content: message.message,
      timestamp: message.created_at,
      direction: message.direction,
      type: message.message_type,
      communication_channel: message.communication_channel,
      status: message.status,
    },
    unreadCount,
    lastActive: message.created_at,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast customer list reorder event (for send/receive messages)
 * This moves the customer to top of the list
 */
export const broadcastCustomerReorder = async (
  orderId: number,
  message: any,
  direction: "inbound" | "outbound"
) => {
  try {
    console.log(`🔄 Broadcasting customer reorder | Order: ${orderId} | Direction: ${direction}`);

    // Get customer info from database
    const [customerRows] = (await pool.query(
      `SELECT 
        lo.order_id,
        lo.order_number,
        TRIM(CONCAT(COALESCE(lo.firstname, ''), ' ', COALESCE(lo.lastname, ''))) AS name,
        lo.phone,
        lo.email,
        lo.status
      FROM logistic_order lo
      WHERE lo.order_id = ?
      LIMIT 1`,
      [orderId]
    )) as [any[], any];

    if (customerRows.length === 0) {
      console.warn(`⚠️ Customer not found for reorder | Order: ${orderId}`);
      return;
    }

    const customer = customerRows[0];

    // Get unread count for this customer
    const [chatRows] = (await pool.query(
      `SELECT convo FROM customer_chats WHERE order_id = ?`,
      [orderId]
    )) as [any[], any];

    let unreadCount = 0;
    if (chatRows.length > 0 && chatRows[0].convo) {
      const messages = typeof chatRows[0].convo === "string" 
        ? JSON.parse(chatRows[0].convo) 
        : chatRows[0].convo;
      unreadCount = messages.filter((m: any) => m.direction === "inbound" && !m.is_read).length;
    }

    // Emit customer reorder event to all admins
    emitToRoom("admin-room", "customer:reorder", {
      orderId,
      orderNumber: customer.order_number,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      status: customer.status,
      lastMessage: {
        content: message.message,
        timestamp: message.created_at,
        direction: message.direction,
        type: message.message_type,
        communication_channel: message.communication_channel,
        status: message.status,
      },
      unreadCount,
      hasUnread: unreadCount > 0,
      lastMessageTime: message.created_at,
      lastChannel: message.communication_channel,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Customer reorder broadcasted | Order: ${orderId} | Unread: ${unreadCount}`);
  } catch (e) {
    console.error("❌ Error broadcasting customer reorder:", e);
  }
};

/**
 * Broadcast message status update
 */
export const broadcastMessageStatus = (
  messageId: string,
  orderId: number,
  status: string,
  channel?: "whatsapp" | "sms" | "email"
) => {
  console.log(`🔄 Broadcasting message status | Channel: ${channel} | Status: ${status}`);
  
  emitToRoom(`order-${orderId}`, "message:status-updated", {
    messageId,
    status,
    channel,
    timestamp: new Date().toISOString(),
  });

  emitToRoom("admin-room", "message:status-updated", {
    messageId,
    orderId,
    status,
    channel,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast total unread count update to all admins
 */
export const broadcastUnreadCount = async (providedCount?: number) => {
  try {
    globalUnreadCount = Math.max(
      0,
      providedCount !== undefined ? providedCount : await getActualUnreadCountFromDB()
    );

    console.log(`📢 Broadcasting total unread count: ${globalUnreadCount}`);

    emitToRoom("admin-room", "unread:count", {
      totalUnreadCount: globalUnreadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ Error broadcasting total unread count:", e);
  }
};

/**
 * Handle message read event
 */
export const handleMessageRead = async (orderId: number, readCount: number = 1) => {
  console.log(`✅ Messages read | Order: ${orderId} | Count: ${readCount}`);

  emitToRoom(`order-${orderId}`, "messages:read", {
    orderId,
    readCount,
    timestamp: new Date().toISOString(),
  });

  // Notify admin room about read status change
  emitToRoom("admin-room", "customer:read-updated", {
    orderId,
    readCount,
    unreadCount: 0,
    hasUnread: false,
    timestamp: new Date().toISOString(),
  });

  await broadcastUnreadCount();
};

/**
 * Broadcast inbound message from customer (via webhook)
 */
export const broadcastInboundMessage = async (
  orderId: number,
  message: any,
  custInfo: any
) => {
  console.log(`📨 Broadcasting inbound message | Order: ${orderId} | Channel: ${message.communication_channel}`);
  
  // Emit to specific order room
  emitMessageToOrder(orderId.toString(), message);
  
  try {
    // Get actual unread count from messages
    const [rows] = (await pool.query(`SELECT convo FROM customer_chats WHERE order_id = ?`, [
      orderId,
    ])) as [any[], any];
    
    let unreadCount = 0;
    if (rows.length > 0 && rows[0].convo) {
      const messages = typeof rows[0].convo === "string" ? JSON.parse(rows[0].convo) : rows[0].convo;
      unreadCount = messages.filter((m: any) => m.direction === "inbound" && !m.is_read).length;
    }
    
    // Broadcast to all admins for customer list update
    broadcastCustomerUpdate(orderId, message, custInfo, unreadCount);
    
    // Broadcast customer reorder event
    await broadcastCustomerReorder(orderId, message, "inbound");
    
    // Update global unread count
    await broadcastUnreadCount();
    
    console.log(`✅ Inbound message broadcasted | Unread: ${unreadCount}`);
  } catch (e) {
    console.error("❌ Error broadcasting inbound message:", e);
  }
};

/**
 * Broadcast outbound message sent by admin
 */
export const broadcastOutboundMessage = async (
  orderId: number,
  message: any,
  _custInfo: any
) => {
  console.log(`📤 Broadcasting outbound message | Order: ${orderId} | Channel: ${message.communication_channel}`);
  
  try {
    // Broadcast customer reorder event for outbound messages
    await broadcastCustomerReorder(orderId, message, "outbound");
    
    console.log(`✅ Outbound message broadcasted | Order: ${orderId}`);
  } catch (e) {
    console.error("❌ Error broadcasting outbound message:", e);
  }
};

/* =================================================================
   UTILITY FUNCTIONS
================================================================= */

export const hasConnectedAdmins = (): boolean => {
  const io = getIO();
  const adminCount = io?.sockets.adapter.rooms.get("admin-room")?.size || 0;
  console.log(`👥 Connected admins: ${adminCount}`);
  return adminCount > 0;
};

export const updateGlobalUnreadCount = async () => {
  await broadcastUnreadCount();
};