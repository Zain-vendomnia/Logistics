import { Socket } from "socket.io";
import pool from "../config/database";
import {
  getIO,
  emitToRoom,
  emitToSocket,
  joinRoom,
  leaveRoom,
  getRoomInfo,
} from "../config/socket";

// Track admin connections
const adminConnections = new Set<string>();
let globalUnreadCount = 0;

/**
 * Get actual unread count from database
 * @returns Total unread count
 */
const getActualUnreadCountFromDB = async (): Promise<number> => {
  try {
    const [rows] = (await pool.query(
      `SELECT COUNT(*) as total_unread FROM whatsapp_chats WHERE direction='inbound' AND is_read=0`
    )) as [{ total_unread: number }[], any];
    return rows[0]?.total_unread || 0;
  } catch (e) {
    console.error("Error getting unread count:", e);
    return 0;
  }
};

/**
 * Initialize global unread count from database
 */
const initializeGlobalUnreadCount = async () => {
  try {
    globalUnreadCount = await getActualUnreadCountFromDB();
  } catch (e) {
    console.error("Error initializing unread count:", e);
    globalUnreadCount = 0;
  }
};

/**
 * Initialize WhatsApp socket event handlers
 */
export const initWhatsAppSocket = () => {
  const io = getIO();

  // Initialize unread count
  initializeGlobalUnreadCount();

  io.on("connection", (socket: Socket) => {
    // Join admin room
    socket.on("join-admin-room", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        socket.join("admin-room");
        adminConnections.add(socket.id);
        globalUnreadCount = await getActualUnreadCountFromDB();

        const timestamp = new Date().toISOString();
        socket.emit("request-initial-customer-list", {
          socketId: socket.id,
          timestamp,
        });
        socket.emit("total-unread-update", {
          totalUnreadCount: globalUnreadCount,
          timestamp,
        });
        socket.emit("admin-room-joined", { socketId: socket.id, timestamp });
      }
    });

    // Leave admin room
    socket.on("leave-admin-room", () => {
      socket.leave("admin-room");
      adminConnections.delete(socket.id);
    });

    // Refresh customer list
    socket.on("refresh-customer-list", () => {
      if (socket.userRole !== "admin" && socket.userRole !== "support") {
        return socket.emit("customer-list-error", {
          error: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
      }
      socket.emit("request-customer-list-refresh", {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Request total unread count
    socket.on("request-total-unread", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        globalUnreadCount = await getActualUnreadCountFromDB();
        const timestamp = new Date().toISOString();
        socket.emit("total-unread-update", {
          totalUnreadCount: globalUnreadCount,
          timestamp,
        });
        socket.emit("request-received", {
          type: "total-unread",
          count: globalUnreadCount,
          timestamp,
        });
      }
    });

    // Join order room
    socket.on(
      "join-order",
      (orderId: string) => orderId && socket.join(`order-${orderId}`)
    );

    // Leave order room
    socket.on(
      "leave-order",
      (orderId: string) => orderId && socket.leave(`order-${orderId}`)
    );

    // Handle disconnect
    socket.on("disconnect", () => adminConnections.delete(socket.id));
  });
};

// ============= Emitters =============

/**
 * Emit new message to specific order room
 * @param orderId - Order ID
 * @param message - Message data
 */
export const emitMessageToOrder = (orderId: string, message: any) =>
  emitToRoom(`order-${orderId}`, "new-message", message);

/**
 * Emit message update to order room
 * @param orderId - Order ID
 * @param tempId - Temporary message ID
 * @param updatedMessage - Updated message data
 */
export const emitMessageUpdate = (
  orderId: string,
  tempId: string,
  updatedMessage: any
) =>
  emitToRoom(`order-${orderId}`, "message-updated", {
    tempId,
    message: updatedMessage,
  });

/**
 * Emit message status update to order room
 * @param orderId - Order ID
 * @param messageId - Message ID
 * @param statusUpdate - Status update data
 */
export const emitMessageStatusUpdate = (
  orderId: string,
  messageId: string,
  statusUpdate: any
) =>
  emitToRoom(`order-${orderId}`, "message-status-updated", {
    messageId,
    update: statusUpdate,
  });

/**
 * Broadcast customer list to all admins
 * @param customers - Array of customer data
 * @param triggerReason - Reason for the update
 */
export const broadcastCustomerList = (
  customers: any[],
  triggerReason?: string
) =>
  emitToRoom("admin-room", "customer-list-update", {
    customers,
    timestamp: new Date().toISOString(),
    triggerReason,
  });

/**
 * Broadcast single customer update to all admins
 * @param customer - Customer data
 * @param updateType - Type of update
 * @param additionalData - Additional data
 */
export const broadcastSingleCustomerUpdate = (
  customer: any,
  updateType: string,
  additionalData?: any
) =>
  emitToRoom("admin-room", "customer-single-update", {
    customer,
    updateType,
    timestamp: new Date().toISOString(),
    additionalData,
  });

/**
 * Broadcast customer update with message details
 * @param orderId - Order ID
 * @param message - Message data
 * @param customerInfo - Customer information
 * @param unreadCount - Unread message count
 */
export const broadcastCustomerUpdate = (
  orderId: number,
  message: any,
  customerInfo: any,
  unreadCount: number
) =>
  emitToRoom("admin-room", "customer-list-update", {
    orderId,
    customerName: customerInfo.name,
    customerPhone: customerInfo.phone,
    message: {
      id: message.id,
      content: message.content || message.body,
      timestamp: message.timestamp || message.created_at,
      direction: message.direction,
      type: message.type,
      message_type: message.message_type,
      fileName: message.fileName,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
    },
    unreadCount,
    lastActive: message.timestamp || message.created_at,
  });

/**
 * Broadcast global message status to all admins
 * @param messageId - Message ID
 * @param orderId - Order ID
 * @param status - Message status
 */
export const broadcastGlobalMessageStatus = (
  messageId: string,
  orderId: number,
  status: string
) =>
  emitToRoom("admin-room", "global-message-status", {
    messageId,
    orderId,
    status,
  });

/**
 * Broadcast total unread count to all admins
 * @param providedCount - Optional pre-calculated count
 */
export const broadcastTotalUnreadCount = async (providedCount?: number) => {
  try {
    globalUnreadCount = Math.max(
      0,
      providedCount !== undefined
        ? providedCount
        : await getActualUnreadCountFromDB()
    );
    emitToRoom("admin-room", "total-unread-update", {
      totalUnreadCount: globalUnreadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error broadcasting total unread count:", e);
  }
};

/**
 * Update global unread count
 */
export const updateGlobalUnreadCount = async () =>
  await broadcastTotalUnreadCount();

/**
 * Handle message read event
 * @param orderId - Order ID
 * @param readCount - Number of messages read
 */
export const handleMessageRead = (orderId: number, readCount: number = 1) =>
  emitToRoom(`order-${orderId}`, "messages-read", {
    orderId,
    readCount,
    timestamp: new Date().toISOString(),
  });

/**
 * Handle new unread message
 * @param orderId - Order ID
 * @param message - Message data
 */
export const handleNewUnreadMessage = (orderId: number, message: any) =>
  emitMessageToOrder(orderId.toString(), message);

/**
 * Get list of connected admin socket IDs
 * @returns Array of socket IDs
 */
export const getConnectedAdminSockets = (): string[] => {
  const io = getIO();
  return Array.from(io?.sockets.adapter.rooms.get("admin-room") || []);
};

/**
 * Check if any admins are connected
 * @returns True if admins are connected
 */
export const hasConnectedAdmins = (): boolean => {
  const io = getIO();
  return !!io?.sockets.adapter.rooms.get("admin-room")?.size;
};

/**
 * Get information about an order room
 * @param orderId - Order ID
 * @returns Room information
 */
export const getOrderRoomInfo = (orderId: string) => {
  return getRoomInfo(`order-${orderId}`);
};

/**
 * Get information about the admin room
 * @returns Admin room information
 */
export const getAdminRoomInfo = () => {
  const roomInfo = getRoomInfo("admin-room");
  return roomInfo
    ? {
        ...roomInfo,
        trackedConnections: adminConnections.size,
      }
    : null;
};

/**
 * Send initial customer list to a specific socket
 * @param socketId - Socket ID
 * @param customers - Array of customer data
 */
export const sendInitialCustomerList = (socketId: string, customers: any[]) => {
  console.log(`📋 Sending initial customer list to socket ${socketId}`);
  emitToSocket(socketId, "customer-list-initial", {
    customers,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send customer list error to a specific socket
 * @param socketId - Socket ID
 * @param errorMessage - Error message
 * @param triggerReason - Reason for the error
 */
export const sendCustomerListError = (
  socketId: string,
  errorMessage: string,
  triggerReason?: string
) => {
  console.log(
    `❌ Sending customer list error to socket ${socketId}: ${errorMessage}`
  );
  emitToSocket(socketId, "customer-list-error", {
    error: errorMessage,
    timestamp: new Date().toISOString(),
    triggerReason,
  });
};

/**
 * Join a socket to an order room
 * @param socketId - Socket ID
 * @param orderId - Order ID
 */
export const joinOrderRoom = (socketId: string, orderId: string) =>
  joinRoom(socketId, `order-${orderId}`);

/**
 * Remove a socket from an order room
 * @param socketId - Socket ID
 * @param orderId - Order ID
 */
export const leaveOrderRoom = (socketId: string, orderId: string) =>
  leaveRoom(socketId, `order-${orderId}`);