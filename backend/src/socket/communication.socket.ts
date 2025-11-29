import { Socket } from "socket.io";
import pool from "../config/database";
import {
  emitToRoom,
  getIO,
} from "../config/socket";
import { getConversationByOrderId } from "../services/communicationService";

// Track admin connections
const adminConnections = new Set<string>();
const adminViewingCustomer = new Map<string, number>(); // socketId -> orderId
let globalUnreadCount = 0;
let customerListCache: any[] = [];
let customerListCacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache for customer list
let timestampSyncInterval: NodeJS.Timeout | null = null;

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
 * ✅ NEW: Get actual unread message count for a specific order from JSON convo
 */
const getUnreadCountForOrder = async (orderId: number): Promise<number> => {
  try {
    const [rows] = (await pool.query(
      `SELECT 
        CASE 
          WHEN convo_is_read = 0 THEN 
            (SELECT COUNT(*) 
             FROM JSON_TABLE(
               convo, 
               '$[*]' COLUMNS(
                 direction VARCHAR(20) PATH '$.direction',
                 is_read INT PATH '$.is_read'
               )
             ) AS jt 
             WHERE jt.direction = 'inbound' AND jt.is_read = 0
            )
          ELSE 0 
        END AS unread_count
      FROM customer_chats
      WHERE order_id = ?`,
      [orderId]
    )) as [any[], any];
    
    return rows[0]?.unread_count || 0;
  } catch (e) {
    console.error(`❌ Error getting unread count for order ${orderId}:`, e);
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
 * Get customer list with pagination and last message timestamps
 */
const getCustomerList = async (
  limit: number = 50,
  offset: number = 0
): Promise<{ customers: any[]; total: number }> => {
  try {
    const now = Date.now();
    
    // Check cache validity
    if (
      customerListCache.length > 0 &&
      now - customerListCacheTimestamp < CACHE_DURATION
    ) {
      console.log(`📦 Using cached customer list | Age: ${now - customerListCacheTimestamp}ms`);
      const total = customerListCache.length;
      const paginated = customerListCache.slice(offset, offset + limit);
      return { customers: paginated, total };
    }

    console.log(`🔄 Fetching fresh customer list from database`);

    // Get customers with their last message info and ACCURATE unread count using JSON_TABLE
    const query = `
      SELECT 
        lo.order_id,
        lo.order_number,
        TRIM(CONCAT(COALESCE(lo.firstname, ''), ' ', COALESCE(lo.lastname, ''))) AS customer_name,
        lo.phone,
        lo.email,
        lo.status,
        cc.last_message,
        cc.last_message_at,
        cc.last_communication_channel,
        cc.convo_is_read,
        CASE WHEN cc.convo_is_read = 0 THEN 1 ELSE 0 END AS has_unread,
        CASE 
          WHEN cc.convo_is_read = 0 THEN 
            (SELECT COUNT(*) 
             FROM JSON_TABLE(
               cc.convo, 
               '$[*]' COLUMNS(
                 direction VARCHAR(20) PATH '$.direction',
                 is_read INT PATH '$.is_read'
               )
             ) AS jt 
             WHERE jt.direction = 'inbound' AND jt.is_read = 0
            )
          ELSE 0 
        END AS unread_count
      FROM logistic_order lo
      LEFT JOIN customer_chats cc ON lo.order_id = cc.order_id
      WHERE lo.status NOT IN ('delivered', 'cancelled')
      ORDER BY 
        has_unread DESC,
        COALESCE(cc.last_message_at, lo.created_at) DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = (await pool.query(query, [
      limit + offset,
      0,
    ])) as [any[], any];

    // Process each row - unread_count now comes directly from query (accurate!)
    const customers = rows.map((row: any) => {
      const lastMessageTime = row.last_message_at 
        ? new Date(row.last_message_at).getTime()
        : null;

      return {
        order_id: row.order_id,
        order_number: row.order_number,
        customer_name: row.customer_name || "Unknown",
        phone: row.phone,
        email: row.email,
        status: row.status,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        last_message_timestamp: lastMessageTime,
        last_communication_channel: row.last_communication_channel || "none",
        unread_count: row.unread_count || 0,
        has_unread: row.has_unread === 1,
      };
    });

    // Get total count
    const [countRows] = (await pool.query(
      `SELECT COUNT(*) as total FROM logistic_order lo 
       WHERE lo.status NOT IN ('delivered', 'cancelled')`
    )) as [{ total: number }[], any];

    const total = countRows[0]?.total || 0;

    // Update cache
    customerListCache = customers;
    customerListCacheTimestamp = now;

    console.log(`✅ Customer list cached | Count: ${customers.length} | Total: ${total}`);

    return {
      customers: customers.slice(offset, offset + limit),
      total,
    };
  } catch (error) {
    console.error(`❌ Error fetching customer list:`, error);
    return { customers: [], total: 0 };
  }
};

/**
 * ✅ FIXED: Get only timestamp updates for all customers (lightweight broadcast)
 * Now uses JSON_TABLE to get accurate unread count instead of just 0/1
 */
const getCustomerTimestampUpdates = async (): Promise<any[]> => {
  try {
    const query = `
      SELECT 
        lo.order_id,
        cc.last_message_at,
        cc.convo_is_read,
        CASE 
          WHEN cc.convo_is_read = 0 THEN 
            (SELECT COUNT(*) 
             FROM JSON_TABLE(
               cc.convo, 
               '$[*]' COLUMNS(
                 direction VARCHAR(20) PATH '$.direction',
                 is_read INT PATH '$.is_read'
               )
             ) AS jt 
             WHERE jt.direction = 'inbound' AND jt.is_read = 0
            )
          ELSE 0 
        END AS unread_count
      FROM logistic_order lo
      LEFT JOIN customer_chats cc ON lo.order_id = cc.order_id
      WHERE lo.status NOT IN ('delivered', 'cancelled')
      AND cc.last_message_at IS NOT NULL
      ORDER BY COALESCE(cc.last_message_at, lo.created_at) DESC
    `;

    const [rows] = (await pool.query(query)) as [any[], any];

    return rows.map((row: any) => ({
      order_id: row.order_id,
      last_message_at: row.last_message_at,
      last_message_timestamp: new Date(row.last_message_at).getTime(),
      unread_count: row.unread_count || 0,  // ✅ Now uses actual count from JSON_TABLE
    }));
  } catch (error) {
    console.error(`❌ Error fetching timestamp updates:`, error);
    return [];
  }
};

/**
 * Start timestamp sync interval
 */
const startTimestampSync = () => {
  if (timestampSyncInterval) return;

  console.log(`⏱️ Starting timestamp sync interval (every 60 seconds)`);

  timestampSyncInterval = setInterval(async () => {
    try {
      const io = getIO();
      const adminRoomSize = io.sockets.adapter.rooms.get("admin-room")?.size || 0;

      if (adminRoomSize === 0) {
        console.log(`⏸️ No admins connected, skipping timestamp sync`);
        return;
      }

      const updates = await getCustomerTimestampUpdates();

      if (updates.length > 0) {
        emitToRoom("admin-room", "customer:timestamp-sync", {
          updates,
          timestamp: new Date().toISOString(),
          updateCount: updates.length,
        });

        console.log(`🔄 Timestamp sync broadcasted | Updates: ${updates.length}`);
      }
    } catch (error) {
      console.error(`❌ Error in timestamp sync:`, error);
    }
  }, 60000); // 60 seconds
};

/**
 * Stop timestamp sync interval
 */
const stopTimestampSync = () => {
  if (timestampSyncInterval) {
    clearInterval(timestampSyncInterval);
    timestampSyncInterval = null;
    console.log(`⏹️ Timestamp sync interval stopped`);
  }
};

/**
 * Initialize Communication socket event handlers
 */
export const initCommunicationSocket = () => {
  const io = getIO();

  // Initialize unread count on startup
  initializeGlobalUnreadCount();

  // Start timestamp sync when first admin joins
  let startedTimestampSync = false;

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

        // Start timestamp sync on first admin join
        if (!startedTimestampSync) {
          startTimestampSync();
          startedTimestampSync = true;
        }

        const timestamp = new Date().toISOString();

        socket.emit("unread:count", {
          totalUnreadCount: globalUnreadCount,
          timestamp,
        });

        socket.emit("admin:joined", {
          socketId: socket.id,
          timestamp,
        });

        // Broadcast that an admin joined
        emitToRoom("admin-room", "admin:status-changed", {
          event: "admin_joined",
          totalAdminsOnline: adminConnections.size,
          timestamp,
        });

        console.log(`✅ Admin ${socket.id} joined admin-room | Unread: ${globalUnreadCount} | Total admins: ${adminConnections.size}`);
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
      adminViewingCustomer.delete(socket.id);

      // Stop timestamp sync if no admins left
      if (adminConnections.size === 0) {
        stopTimestampSync();
        startedTimestampSync = false;
      }

      emitToRoom("admin-room", "admin:status-changed", {
        event: "admin_left",
        totalAdminsOnline: adminConnections.size,
        timestamp: new Date().toISOString(),
      });

      console.log(`🚪 Admin ${socket.id} left admin-room | Total admins: ${adminConnections.size}`);
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
       EVENT 4: REQUEST CUSTOMER LIST (WITH PAGINATION)
    ================================================================= */
    socket.on("customer:list-request", async (data: { limit?: number; offset?: number }) => {
      try {
        if (socket.userRole !== "admin" && socket.userRole !== "support") {
          return socket.emit("error", { message: "Unauthorized" });
        }

        const limit = Math.min(data.limit || 50, 100); // Max 100 per page
        const offset = Math.max(data.offset || 0, 0);

        const { customers, total } = await getCustomerList(limit, offset);

        socket.emit("customer:list-response", {
          customers,
          pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total,
          },
          timestamp: new Date().toISOString(),
        });

        console.log(`📋 Customer list sent to ${socket.id} | Count: ${customers.length} | Total: ${total}`);
      } catch (err) {
        console.error("❌ Error fetching customer list:", err);
        socket.emit("error", { message: "Failed to fetch customer list" });
      }
    });

    /* =================================================================
       EVENT 5: ADMIN VIEWING CUSTOMER (PRESENCE TRACKING)
    ================================================================= */
    socket.on("admin:viewing-customer", (data: { orderId: number }) => {
      if (!data.orderId) return;

      adminViewingCustomer.set(socket.id, data.orderId);

      // Broadcast to all admins that someone is viewing this customer
      emitToRoom("admin-room", "customer:viewer-update", {
        orderId: data.orderId,
        viewedBySocketId: socket.id,
        viewedByUserId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `👁️ Admin ${socket.id} (${socket.userId}) viewing customer ${data.orderId}`
      );
    });

    /* =================================================================
       EVENT 6: ADMIN LEFT CUSTOMER CHAT
    ================================================================= */
    socket.on("admin:left-customer-chat", (data: { orderId: number }) => {
      if (!data.orderId) return;

      adminViewingCustomer.delete(socket.id);

      // Broadcast that admin left this customer
      emitToRoom("admin-room", "customer:viewer-left", {
        orderId: data.orderId,
        leftBySocketId: socket.id,
        leftByUserId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`👋 Admin ${socket.id} (${socket.userId}) left customer ${data.orderId}`);
    });

    /* =================================================================
       EVENT 7: GET SINGLE CUSTOMER MESSAGES
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
       EVENT 8: JOIN SPECIFIC CUSTOMER CHAT
    ================================================================= */
    socket.on("customer:join", (orderId: string) => {
      if (orderId) {
        socket.join(`order-${orderId}`);
        console.log(`📥 Socket ${socket.id} joined order-${orderId}`);
      }
    });

    /* =================================================================
       EVENT 9: LEAVE SPECIFIC CUSTOMER CHAT
    ================================================================= */
    socket.on("customer:leave", (orderId: string) => {
      if (orderId) {
        socket.leave(`order-${orderId}`);
        console.log(`📤 Socket ${socket.id} left order-${orderId}`);
      }
    });

    /* =================================================================
       EVENT 10: MARK MESSAGES AS READ
       ✅ FIXED: Consistent field naming (camelCase)
    ================================================================= */
    socket.on("messages:mark-read", async (data: { orderId: number }) => {
      try {
        if (socket.userRole !== "admin" && socket.userRole !== "support") {
          return socket.emit("error", { message: "Unauthorized" });
        }

        const { orderId } = data;
        if (!orderId) {
          return socket.emit("error", { message: "Missing orderId" });
        }

        // Import markMessagesAsRead from service
        const { markMessagesAsRead } = await import("../services/communicationService");
        
        // Mark messages as read in DB
        await markMessagesAsRead(orderId);

        // Invalidate cache since read status changed
        invalidateCustomerListCache();

        console.log(`✅ Messages marked as read via socket | Order: ${orderId}`);
      } catch (error) {
        console.error("❌ Error in messages:mark-read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    /* =================================================================
       DISCONNECT HANDLER
    ================================================================= */
    socket.on("disconnect", () => {
      adminConnections.delete(socket.id);
      adminViewingCustomer.delete(socket.id);

      // Stop timestamp sync if no admins left
      if (adminConnections.size === 0) {
        stopTimestampSync();
        startedTimestampSync = false;
      }

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
  console.log(`🔔 Broadcasting customer update | Order: ${orderId} | Channel: ${message.communication_channel} | Unread: ${unreadCount}`);

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
 * ✅ FIXED: Broadcast customer list reorder event (for send/receive messages)
 * Now uses getUnreadCountForOrder() for accurate count instead of 0/1
 */
export const broadcastCustomerReorder = async (
  orderId: number,
  message: any,
  direction: "inbound" | "outbound"
) => {
  try {
    console.log(`🔄 Broadcasting customer reorder | Order: ${orderId} | Direction: ${direction}`);

    // Invalidate customer list cache to force refresh on next request
    customerListCache = [];
    customerListCacheTimestamp = 0;

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

    // ✅ FIXED: Get ACTUAL unread count using JSON_TABLE instead of just 0/1
    const unreadCount = await getUnreadCountForOrder(orderId);

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
      unreadCount,  // ✅ Now shows actual count (e.g., 3, 5, etc.) not just 1
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
 * ✅ FIXED: Consistent field naming (camelCase) for frontend compatibility
 */
export const handleMessageRead = async (orderId: number, readCount: number = 1) => {
  console.log(`✅ Messages read | Order: ${orderId} | Count: ${readCount}`);

  // Emit to specific order room
  emitToRoom(`order-${orderId}`, "messages:read", {
    orderId,
    readCount,
    timestamp: new Date().toISOString(),
  });

  // ✅ FIXED: Notify admin room about read status change with CONSISTENT camelCase fields
  emitToRoom("admin-room", "customer:read-updated", {
    orderId,
    readCount,
    unreadCount: 0,      // ✅ camelCase - matches frontend expectation
    hasUnread: false,    // ✅ camelCase - matches frontend expectation
    timestamp: new Date().toISOString(),
  });

  // Invalidate cache
  invalidateCustomerListCache();

  // Update global unread count
  await broadcastUnreadCount();
};

/**
 * ✅ FIXED: Broadcast inbound message from customer (via webhook)
 * Now uses getUnreadCountForOrder() for accurate count instead of 0/1
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
    // ✅ FIXED: Get ACTUAL unread count using JSON_TABLE instead of just 0/1
    const unreadCount = await getUnreadCountForOrder(orderId);
    
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

/**
 * Get count of admins viewing a specific customer
 */
export const getCustomerViewerCount = (orderId: number): number => {
  let count = 0;
  adminViewingCustomer.forEach((id) => {
    if (id === orderId) count++;
  });
  return count;
};

/**
 * Check if any admin is currently viewing a customer
 */
export const isCustomerBeingViewed = (orderId: number): boolean => {
  let isViewed = false;
  adminViewingCustomer.forEach((id) => {
    if (id === orderId) isViewed = true;
  });
  return isViewed;
};

/**
 * Force invalidate customer list cache
 */
export const invalidateCustomerListCache = () => {
  customerListCache = [];
  customerListCacheTimestamp = 0;
  console.log(`♻️ Customer list cache invalidated`);
};