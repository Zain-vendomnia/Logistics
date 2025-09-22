import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import config from "./config";

declare module "socket.io" {
  interface Socket {
    user?: any;
    userRole?: string;
    userId?: string;
  }
}

let io: Server;
const adminConnections = new Set<string>();
let globalUnreadCount = 0; // Track total unread messages

export const initSocket = (app: express.Application) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware: auth check
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    try {
      const decoded = jwt.verify(token, config.SECRET) as any;
      socket.user = decoded;
      socket.userId = decoded.id;
      socket.userRole = decoded.role || 'admin';
      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}, Role: ${socket.userRole}`);

    // Handle admin joining the global room for customer list updates
    socket.on("join-admin-room", () => {
      if (socket.userRole === 'admin' || socket.userRole === 'support') {
        socket.join('admin-room');
        adminConnections.add(socket.id);
        socket.emit('request-initial-customer-list', {
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        // Send current total unread count to newly connected admin
        socket.emit('total-unread-update', {
          totalUnreadCount: globalUnreadCount,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on("leave-admin-room", () => {
      socket.leave('admin-room');
      adminConnections.delete(socket.id);
    });

    // Handle customer list refresh requests - OPTIMIZED
    socket.on("refresh-customer-list", () => {
      if (socket.userRole !== 'admin' && socket.userRole !== 'support') {
        socket.emit('customer-list-error', {
          error: 'Unauthorized',
          timestamp: new Date().toISOString()
        });
        return;
      }
      socket.emit('request-customer-list-refresh', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Request current total unread count
    socket.on("request-total-unread", () => {
      if (socket.userRole === 'admin' || socket.userRole === 'support') {
        socket.emit('total-unread-update', {
          totalUnreadCount: globalUnreadCount,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Join order-specific room
    socket.on("join-order", (orderId: string) => {
      if (!orderId) return;
      socket.join(`order-${orderId}`);
    });

    socket.on("leave-order", (orderId: string) => {
      if (!orderId) return;
      socket.leave(`order-${orderId}`);
    });

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      adminConnections.delete(socket.id);
    });
  });

  return server;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Global event emitter - KEEPING FOR OTHER FEATURES
export const emitEvent = (event: string, payload: any) => {
  if (!io) {
    console.warn(`Socket.IO not initialized. Event '${event}' not emitted.`);
    return;
  }
  io.emit(event, payload);
  console.log(`Event emitted: ${event}`, payload);
};

// newOrder event emitter - KEEPING FOR OTHER FEATURES
export const emitNewOrder = (order: any) => {
  emitEvent("new-order", order);
};

// OPTIMIZED: Helper for room emissions
const emitToRoom = (room: string, event: string, data: any) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

// OPTIMIZED: Chat message functions
export const emitMessageToOrder = (orderId: string, message: any) => 
  emitToRoom(`order-${orderId}`, "new-message", message);

export const emitMessageUpdate = (orderId: string, tempId: string, updatedMessage: any) =>
  emitToRoom(`order-${orderId}`, "message-updated", { tempId, message: updatedMessage });

export const emitMessageStatusUpdate = (orderId: string, messageId: string, statusUpdate: any) =>
  emitToRoom(`order-${orderId}`, "message-status-updated", { messageId, update: statusUpdate });

// OPTIMIZED: Customer list functions
export const sendInitialCustomerList = (socketId: string, customers: any[]) => {
  const socket = io?.sockets.sockets.get(socketId);
  socket?.emit('customer-list-initial', {
    customers,
    timestamp: new Date().toISOString()
  });
};

export const sendCustomerListRefresh = sendInitialCustomerList;

export const sendCustomerListError = (socketId: string, errorMessage: string, triggerReason?: string) => {
  const socket = io?.sockets.sockets.get(socketId);
  socket?.emit('customer-list-error', {
    error: errorMessage,
    timestamp: new Date().toISOString(),
    triggerReason
  });
};

export const broadcastCustomerList = (customers: any[], triggerReason?: string) =>
  emitToRoom('admin-room', 'customer-list-update', {
    customers,
    timestamp: new Date().toISOString(),
    triggerReason
  });

export const broadcastSingleCustomerUpdate = (customer: any, updateType: string, additionalData?: any) =>
  emitToRoom('admin-room', 'customer-single-update', {
    customer,
    updateType,
    timestamp: new Date().toISOString(),
    additionalData
  });

// KEEPING BUT SIMPLIFIED: Legacy customer update function
export const broadcastCustomerUpdate = (
  orderId: number,
  message: any,
  customerInfo: any,
  unreadCount: number
) => {
  emitToRoom('admin-room', 'customer-list-update', {
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
      fileType: message.fileType
    },
    unreadCount,
    lastActive: message.timestamp || message.created_at
  });
};

export const broadcastGlobalMessageStatus = (messageId: string, orderId: number, status: string) =>
  emitToRoom('admin-room', 'global-message-status', { messageId, orderId, status });

// NEW: Total unread messages functions
export const broadcastTotalUnreadCount = (totalUnreadCount: number) => {
  emitToRoom('admin-room', 'total-unread-update', {
    totalUnreadCount,
    timestamp: new Date().toISOString()
  });
  globalUnreadCount = totalUnreadCount;
};

export const updateTotalUnreadCount = (increment: number) => {
  globalUnreadCount = Math.max(0, globalUnreadCount + increment);
  broadcastTotalUnreadCount(globalUnreadCount);
};

export const setTotalUnreadCount = (count: number) => {
  globalUnreadCount = Math.max(0, count);
  broadcastTotalUnreadCount(globalUnreadCount);
};

export const getTotalUnreadCount = (): number => {
  return globalUnreadCount;
};

export const calculateAndBroadcastTotalUnread = (customers: any[]) => {
  const total = customers.reduce((sum, customer) => {
    return sum + (customer.unreadCount || 0);
  }, 0);
  setTotalUnreadCount(total);
  return total;
};

export const handleMessageRead = (orderId: number, readCount: number = 1) => {
  updateTotalUnreadCount(-readCount);
  emitToRoom(`order-${orderId}`, "messages-read", {
    orderId,
    readCount,
    timestamp: new Date().toISOString()
  });
};

export const handleNewUnreadMessage = (orderId: number, message: any) => {
  updateTotalUnreadCount(1);
  emitMessageToOrder(orderId.toString(), message);
};

// OPTIMIZED: Utility functions
export const getConnectedAdminSockets = (): string[] => {
  const room = io?.sockets.adapter.rooms.get('admin-room');
  return room ? Array.from(room) : [];
};

export const hasConnectedAdmins = (): boolean => {
  const room = io?.sockets.adapter.rooms.get('admin-room');
  return !!(room && room.size > 0);
};

// KEEPING FOR DEBUGGING PURPOSES
export const getOrderRoomInfo = (orderId: string) => {
  if (!io) return null;
  const roomName = `order-${orderId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  return {
    roomName,
    connectedClients: room ? room.size : 0,
    clientIds: room ? Array.from(room) : [],
  };
};

export const getAdminRoomInfo = () => {
  if (!io) return null;
  const room = io.sockets.adapter.rooms.get('admin-room');
  return {
    roomName: 'admin-room',
    connectedAdmins: room ? room.size : 0,
    adminIds: room ? Array.from(room) : [],
    trackedConnections: adminConnections.size
  };
};

// Join/Leave order room programmatically - KEEPING FOR OTHER FEATURES
export const joinOrderRoom = (socketId: string, orderId: string) => {
  if (!io) return;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    const roomName = `order-${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socketId} programmatically joined room: ${roomName}`);
  }
};

export const leaveOrderRoom = (socketId: string, orderId: string) => {
  if (!io) return;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    const roomName = `order-${orderId}`;
    socket.leave(roomName);
    console.log(`Socket ${socketId} programmatically left room: ${roomName}`);
  }
};