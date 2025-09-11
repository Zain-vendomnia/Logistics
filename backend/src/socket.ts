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

// Store admin connections for broadcasting customer updates
const adminConnections = new Set<string>();

export const initSocket = (app: express.Application) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "*", // adjust to your frontend origin in production
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
      socket.userRole = decoded.role || 'admin'; // Default to admin for now
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
        console.log(`Admin ${socket.id} joined admin room`);
      } else {
        console.log(`Non-admin user ${socket.id} attempted to join admin room`);
      }
    });

    // Handle leaving admin room
    socket.on("leave-admin-room", () => {
      socket.leave('admin-room');
      adminConnections.delete(socket.id);
      console.log(`Admin ${socket.id} left admin room`);
    });

    // Join order-specific room
    socket.on("join-order", (orderId: string) => {
      if (!orderId) {
        console.error("No orderId provided for join-order");
        return;
      }
      const roomName = `order-${orderId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Leave order-specific room
    socket.on("leave-order", (orderId: string) => {
      if (!orderId) {
        console.error("No orderId provided for leave-order");
        return;
      }
      const roomName = `order-${orderId}`;
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    // Handle customer status updates
    socket.on("update-customer-status", (data: { orderId: number; status: string }) => {
      const { orderId, status } = data;
      
      // Broadcast to all admins
      socket.to('admin-room').emit('customer-status-update', {
        orderId,
        status,
        lastSeen: new Date().toISOString()
      });
      
      console.log(`Customer status updated: Order ${orderId} -> ${status}`);
    });

    // Handle direct message sending via socket
    socket.on("send-message", (data: { orderId: string; sender: string; content: string; type: string }) => {
      const { orderId, sender, content, type } = data;

      if (!orderId || !sender || !content) {
        socket.emit("message-error", { error: "Missing required fields" });
        return;
      }

      const roomName = `order-${orderId}`;
      const message = {
        id: `temp-${Date.now()}`, // temporary ID, replace with DB ID when saving
        orderId,
        sender,
        content,
        type: type || "text",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: new Date().toISOString(),
      };

      // Broadcast to all clients in the room
      io.to(roomName).emit("new-message", message);
      console.log(`Message sent to room ${roomName}:`, message);
    });

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      adminConnections.delete(socket.id);
    });
  });

  return server;
};

// Export function to get IO instance
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Global event emitter
export const emitEvent = (event: string, payload: any) => {
  if (!io) {
    console.warn(`Socket.IO not initialized. Event '${event}' not emitted.`);
    return;
  }
  io.emit(event, payload);
  console.log(`Event emitted: ${event}`, payload);
};

// newOrder event emitter
export const emitNewOrder = (order: any) => {
  emitEvent("new-order", order);
};

// Join order room programmatically
export const joinOrderRoom = (socketId: string, orderId: string) => {
  if (!io) return;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    const roomName = `order-${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socketId} programmatically joined room: ${roomName}`);
  }
};

// Leave order room programmatically
export const leaveOrderRoom = (socketId: string, orderId: string) => {
  if (!io) return;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    const roomName = `order-${orderId}`;
    socket.leave(roomName);
    console.log(`Socket ${socketId} programmatically left room: ${roomName}`);
  }
};

// Emit message to specific order room with consistent room naming
export const emitMessageToOrder = (orderId: string, message: any) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Message not emitted.');
    return;
  }
  
  // Use consistent room naming: order-{orderId} (matching your existing pattern)
  const roomName = `order-${orderId}`;
  io.to(roomName).emit("new-message", message);
  console.log(`Message emitted to room ${roomName}:`, message.id);
};

// Emit message updates (for optimistic UI updates)
export const emitMessageUpdate = (orderId: string, tempId: string, updatedMessage: any) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Message update not emitted.');
    return;
  }
  
  const roomName = `order-${orderId}`;
  io.to(roomName).emit("message-updated", {
    tempId,
    message: updatedMessage
  });
  console.log(`Message update emitted to room ${roomName}:`, { tempId, messageId: updatedMessage.id });
};

// Emit message status updates (for delivery status changes)
export const emitMessageStatusUpdate = (orderId: string, messageId: string, statusUpdate: any) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Status update not emitted.');
    return;
  }
  
  const roomName = `order-${orderId}`;
  io.to(roomName).emit("message-status-updated", {
    messageId,
    update: statusUpdate
  });
  console.log(`Status update emitted to room ${roomName}:`, { messageId, statusUpdate });
};

// MAIN FUNCTION: Single customer update broadcast (replaces multiple events)
export const broadcastCustomerUpdate = (
  orderId: number,
  message: any,
  customerInfo: any,
  unreadCount: number
) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Customer update not broadcasted.');
    return;
  }

  // Check if admin room has any connections
  const adminRoom = io.sockets.adapter.rooms.get('admin-room');
  if (!adminRoom || adminRoom.size === 0) {
    console.warn('No admins connected to broadcast customer update');
    return;
  }

  const updateData = {
    orderId,
    customerName: customerInfo.name,
    customerPhone: customerInfo.phone,
    // Message data
    message: {
      id: message.id,
      content: message.content || message.body || '', // Handle empty content
      timestamp: message.timestamp || message.created_at,
      direction: message.direction,
      type: message.type,
      message_type: message.message_type,
      fileName: message.fileName,
      fileUrl: message.fileUrl,
      fileType: message.fileType
    },
    // Unread count
    unreadCount,
    // Timestamp for sorting
    lastActive: message.timestamp || message.created_at
  };

  // Single event for all admin updates
  io.to('admin-room').emit('customer-list-update', updateData);
  
  console.log(`📡 Customer update broadcasted to ${adminRoom.size} admins: Order ${orderId}, Message: "${message.content || message.body || '[no content]'}", Unread: ${unreadCount}`);
};

// Broadcast customer status changes (online/offline)
export const broadcastCustomerStatusUpdate = (orderId: number, status: string, lastSeen?: string) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Customer status update not broadcasted.');
    return;
  }
  
  io.to('admin-room').emit('customer-status-update', {
    orderId,
    status,
    lastSeen: lastSeen || new Date().toISOString()
  });
  
  console.log(`Broadcasting customer status: Order ${orderId} -> ${status}`);
};

// Broadcast global message status updates (delivery status)
export const broadcastGlobalMessageStatus = (messageId: string, orderId: number, status: string) => {
  if (!io) {
    console.warn('Socket.IO not initialized. Global message status not broadcasted.');
    return;
  }
  
  io.to('admin-room').emit('global-message-status', {
    messageId,
    orderId,
    status
  });
  
  console.log(`Broadcasting global message status: Message ${messageId} -> ${status}`);
};

// Get room information (for debugging)
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

// Get admin room information (for debugging)
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

// Debug function for monitoring customer updates
export const debugCustomerUpdates = () => {
  if (!io) return { error: 'Socket.IO not initialized' };
  
  const adminRoom = io.sockets.adapter.rooms.get('admin-room');
  
  return {
    adminRoomExists: !!adminRoom,
    adminRoomSize: adminRoom?.size || 0,
    adminConnections: Array.from(adminConnections),
    events: {
      singleEvent: 'customer-list-update', // The single event we're using
      // Note: Removed old events: global-new-message, unread-count-update
    },
    totalSockets: io.sockets.sockets.size
  };
};