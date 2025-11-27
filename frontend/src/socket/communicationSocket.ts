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
// CUSTOMER LIST
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