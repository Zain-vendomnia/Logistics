// communicationSocket.ts
// All socket event handlers for communication - imports socketInstance

import socket from './socketInstance';

// ============================================================================
// ADMIN ROOM
// ============================================================================

export const joinAdminRoom = () => {
  if (socket?.connected) {
    socket.emit("admin:join");
    console.log("📥 Joined admin room");
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

export const leaveAdminRoom = () => {
  if (socket?.connected) {
    socket.emit("admin:leave");
    console.log("📤 Left admin room");
  }
};

export const onAdminJoined = (callback: (data: any) => void) => {
  socket?.on("admin:joined", callback);
};

// ============================================================================
// CUSTOMER LIST (NEW - Phase 1)
// ============================================================================

/**
 * Request paginated customer list from server
 */
export const requestCustomerList = (limit: number = 50, offset: number = 0) => {
  if (socket?.connected) {
    socket.emit("customer:list-request", { limit, offset });
    console.log(`📋 Requested customer list | Limit: ${limit}, Offset: ${offset}`);
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

/**
 * Listen for customer list response from server
 */
export const onCustomerListResponse = (callback: (data: any) => void) => {
  socket?.on("customer:list-response", callback);
};

/**
 * Listen for periodic timestamp updates (every 60 seconds)
 * Data: { updates: [{ order_id, last_message_at, unread_count }], timestamp, updateCount }
 */
export const onCustomerTimestampSync = (callback: (data: any) => void) => {
  socket?.on("customer:timestamp-sync", callback);
};

// ============================================================================
// CUSTOMER LIST (LEGACY)
// ============================================================================

export const getCustomersList = () => {
  if (socket?.connected) {
    socket.emit("customers:get-list");
    console.log("📋 Requested customers list");
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

export const onCustomersList = (callback: (data: any) => void) => {
  socket?.on("customers:list", callback);
};

export const onCustomerUpdated = (callback: (data: any) => void) => {
  socket?.on("customer:updated", callback);
};

/**
 * Listen for customer reorder events
 * Triggered when messages are sent or received - moves customer to top
 */
export const onCustomerReorder = (callback: (data: any) => void) => {
  socket?.on("customer:reorder", callback);
};

/**
 * Listen for customer read status updates
 * Triggered when messages are marked as read
 */
export const onCustomerReadUpdated = (callback: (data: any) => void) => {
  socket?.on("customer:read-updated", callback);
};

// ============================================================================
// ADMIN PRESENCE TRACKING (NEW - Phase 1)
// ============================================================================

/**
 * Tell other admins you're viewing this customer
 * This prevents duplicate replies and shows collaboration
 */
export const notifyAdminViewing = (orderId: number) => {
  if (socket?.connected) {
    socket.emit("admin:viewing-customer", { orderId });
    console.log(`👁️ Notified admins viewing customer: ${orderId}`);
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

/**
 * Tell other admins you left this customer chat
 */
export const notifyAdminLeftChat = (orderId: number) => {
  if (socket?.connected) {
    socket.emit("admin:left-customer-chat", { orderId });
    console.log(`👋 Notified admins left customer: ${orderId}`);
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

/**
 * Listen for other admins viewing customers
 * Data: { orderId, viewedBySocketId, viewedByUserId, timestamp }
 */
export const onCustomerViewerUpdate = (callback: (data: any) => void) => {
  socket?.on("customer:viewer-update", callback);
};

/**
 * Listen for other admins leaving customer chats
 * Data: { orderId, leftByUserId, timestamp }
 */
export const onCustomerViewerLeft = (callback: (data: any) => void) => {
  socket?.on("customer:viewer-left", callback);
};

/**
 * Listen for admin room status changes (join/leave)
 * Data: { event: 'join'|'leave', totalAdminsOnline }
 */
export const onAdminStatusChanged = (callback: (data: any) => void) => {
  socket?.on("admin:status-changed", callback);
};

// ============================================================================
// UNREAD COUNT
// ============================================================================

export const getUnreadCount = () => {
  if (socket?.connected) {
    socket.emit("unread:get-count");
    console.log("📊 Requested unread count");
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

export const onUnreadCount = (callback: (data: any) => void) => {
  socket?.on("unread:count", callback);
};

// ============================================================================
// CUSTOMER CHAT
// ============================================================================

export const joinCustomerChat = (orderId: number) => {
  if (socket?.connected) {
    socket.emit("customer:join", orderId.toString());
    console.log(`📥 Joined customer chat: ${orderId}`);
  } else {
    console.warn(`⚠️ Socket not connected, cannot join chat ${orderId}`);
  }
};

export const leaveCustomerChat = (orderId: number) => {
  if (socket?.connected) {
    socket.emit("customer:leave", orderId.toString());
    console.log(`📤 Left customer chat: ${orderId}`);
  }
};

export const getCustomerMessages = (orderId: number) => {
  if (socket?.connected) {
    socket.emit("customer:get-messages", { orderId });
    console.log(`💬 Requested messages for order: ${orderId}`);
  } else {
    console.warn(`⚠️ Socket not connected, cannot get messages for ${orderId}`);
  }
};

export const onCustomerMessages = (callback: (data: any) => void) => {
  socket?.on("customer:messages", callback);
};

export const onNewMessage = (callback: (data: any) => void) => {
  socket?.on("message:new", callback);
};

export const onMessagesRead = (callback: (data: any) => void) => {
  socket?.on("messages:read", callback);
};

// ============================================================================
// MESSAGE STATUS
// ============================================================================

export const getMessageStatus = (messageId: string, orderId: number) => {
  if (socket?.connected) {
    socket.emit("message:get-status", { messageId, orderId });
    console.log(`🔍 Requested status for message: ${messageId}`);
  } else {
    console.warn("⚠️ Socket not connected");
  }
};

export const onMessageStatus = (callback: (data: any) => void) => {
  socket?.on("message:status", callback);
};

export const onMessageStatusError = (callback: (data: any) => void) => {
  socket?.on("message:status-error", callback);
};

export const onMessageStatusUpdated = (callback: (data: any) => void) => {
  socket?.on("message:status-updated", callback);
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

export const onError = (callback: (error: any) => void) => {
  socket?.on("error", callback);
};

// ============================================================================
// CLEANUP
// ============================================================================

export const offEvent = (eventName: string) => {
  socket?.off(eventName);
};

export const offAllEvents = () => {
  if (socket) {
    socket.removeAllListeners();
    console.log("🧹 Removed all socket listeners");
  }
};