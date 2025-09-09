import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import config from "./config";

declare module "socket.io" {
  interface Socket {
    user?: any;
  }
}

let io: Server;

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
      const decoded = jwt.verify(token, config.SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

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

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return server;
};

// ===================== Utility Functions =====================

// 🆕 NEW: Export function to get IO instance
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

// 🔄 UPDATED: Emit message to specific order room with consistent room naming
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

// 🆕 NEW: Emit message updates (for optimistic UI updates)
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

// 🆕 NEW: Emit message status updates (for delivery status changes)
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