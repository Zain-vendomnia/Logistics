import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import config from "./config";
import pool from "./database";

declare module "socket.io" {
  interface Socket { user?: any; userRole?: string; userId?: string; }
}

let io: Server;
const adminConnections = new Set<string>();
let globalUnreadCount = 0;

const getActualUnreadCountFromDB = async (): Promise<number> => {
  try {
    const [rows] = (await pool.query(`SELECT COUNT(*) as total_unread FROM whatsapp_chats WHERE direction='inbound' AND is_read=0`)) as [{ total_unread: number }[], any];
    return rows[0]?.total_unread || 0;
  } catch (e) {
    console.error("Error getting unread count:", e);
    return 0;
  }
};

const initializeGlobalUnreadCount = async () => {
  try {
    globalUnreadCount = await getActualUnreadCountFromDB();
  } catch (e) {
    console.error("Error initializing unread count:", e);
    globalUnreadCount = 0;
  }
};

const emitToRoom = (room: string, event: string, data: any) => io?.to(room).emit(event, data);

export const initSocket = (app: express.Application) => {
  const server = http.createServer(app);
  io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }, transports: ["websocket", "polling"] });
  
  initializeGlobalUnreadCount();

  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token missing"));
    
    try {
      const decoded = jwt.verify(token, config.SECRET) as any;
      Object.assign(socket, { user: decoded, userId: decoded.id, userRole: decoded.role || "admin" });
      next();
    } catch (e) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join-admin-room", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        socket.join("admin-room");
        adminConnections.add(socket.id);
        globalUnreadCount = await getActualUnreadCountFromDB();
        
        const timestamp = new Date().toISOString();
        socket.emit("request-initial-customer-list", { socketId: socket.id, timestamp });
        socket.emit("total-unread-update", { totalUnreadCount: globalUnreadCount, timestamp });
        socket.emit("admin-room-joined", { socketId: socket.id, timestamp });
      }
    });

    socket.on("leave-admin-room", () => {
      socket.leave("admin-room");
      adminConnections.delete(socket.id);
    });

    socket.on("refresh-customer-list", () => {
      if (socket.userRole !== "admin" && socket.userRole !== "support") {
        return socket.emit("customer-list-error", { error: "Unauthorized", timestamp: new Date().toISOString() });
      }
      socket.emit("request-customer-list-refresh", { socketId: socket.id, timestamp: new Date().toISOString() });
    });

    socket.on("request-total-unread", async () => {
      if (socket.userRole === "admin" || socket.userRole === "support") {
        globalUnreadCount = await getActualUnreadCountFromDB();
        const timestamp = new Date().toISOString();
        socket.emit("total-unread-update", { totalUnreadCount: globalUnreadCount, timestamp });
        socket.emit("request-received", { type: "total-unread", count: globalUnreadCount, timestamp });
      }
    });

    socket.on("join-order", (orderId: string) => orderId && socket.join(`order-${orderId}`));
    socket.on("leave-order", (orderId: string) => orderId && socket.leave(`order-${orderId}`));
    
    socket.on("disconnect", () => adminConnections.delete(socket.id));
  });

  return server;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// Emitters
export const emitMessageToOrder = (orderId: string, message: any) => emitToRoom(`order-${orderId}`, "new-message", message);
export const emitMessageUpdate = (orderId: string, tempId: string, updatedMessage: any) => emitToRoom(`order-${orderId}`, "message-updated", { tempId, message: updatedMessage });
export const emitMessageStatusUpdate = (orderId: string, messageId: string, statusUpdate: any) => emitToRoom(`order-${orderId}`, "message-status-updated", { messageId, update: statusUpdate });
export const broadcastCustomerList = (customers: any[], triggerReason?: string) => emitToRoom("admin-room", "customer-list-update", { customers, timestamp: new Date().toISOString(), triggerReason });
export const broadcastSingleCustomerUpdate = (customer: any, updateType: string, additionalData?: any) => emitToRoom("admin-room", "customer-single-update", { customer, updateType, timestamp: new Date().toISOString(), additionalData });

export const broadcastCustomerUpdate = (orderId: number, message: any, customerInfo: any, unreadCount: number) =>
  emitToRoom("admin-room", "customer-list-update", {
    orderId, customerName: customerInfo.name, customerPhone: customerInfo.phone,
    message: {
      id: message.id, content: message.content || message.body, timestamp: message.timestamp || message.created_at,
      direction: message.direction, type: message.type, message_type: message.message_type,
      fileName: message.fileName, fileUrl: message.fileUrl, fileType: message.fileType,
    },
    unreadCount, lastActive: message.timestamp || message.created_at,
  });

export const broadcastGlobalMessageStatus = (messageId: string, orderId: number, status: string) => emitToRoom("admin-room", "global-message-status", { messageId, orderId, status });

export const broadcastTotalUnreadCount = async (providedCount?: number) => {
  try {
    globalUnreadCount = Math.max(0, providedCount !== undefined ? providedCount : await getActualUnreadCountFromDB());
    emitToRoom("admin-room", "total-unread-update", { totalUnreadCount: globalUnreadCount, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("Error broadcasting total unread count:", e);
  }
};

export const updateGlobalUnreadCount = async () => await broadcastTotalUnreadCount();
export const handleMessageRead = (orderId: number, readCount: number = 1) => emitToRoom(`order-${orderId}`, "messages-read", { orderId, readCount, timestamp: new Date().toISOString() });
export const handleNewUnreadMessage = (orderId: number, message: any) => emitMessageToOrder(orderId.toString(), message);
export const getConnectedAdminSockets = (): string[] => Array.from(io?.sockets.adapter.rooms.get("admin-room") || []);
export const hasConnectedAdmins = (): boolean => !!(io?.sockets.adapter.rooms.get("admin-room")?.size);

export const getOrderRoomInfo = (orderId: string) => {
  if (!io) return null;
  const room = io.sockets.adapter.rooms.get(`order-${orderId}`);
  return { roomName: `order-${orderId}`, connectedClients: room?.size || 0, clientIds: Array.from(room || []) };
};

export const getAdminRoomInfo = () => {
  if (!io) return null;
  const room = io.sockets.adapter.rooms.get("admin-room");
  return { roomName: "admin-room", connectedAdmins: room?.size || 0, adminIds: Array.from(room || []), trackedConnections: adminConnections.size };
};

// Customer list functions
export const sendInitialCustomerList = (socketId: string, customers: any[]) => {
  const socket = io?.sockets.sockets.get(socketId);
  if (socket) {
    console.log(`📋 Sending initial customer list to socket ${socketId}`);
    socket.emit('customer-list-initial', {
      customers,
      timestamp: new Date().toISOString()
    });
  }
};

export const sendCustomerListError = (socketId: string, errorMessage: string, triggerReason?: string) => {
  const socket = io?.sockets.sockets.get(socketId);
  if (socket) {
    console.log(`❌ Sending customer list error to socket ${socketId}: ${errorMessage}`);
    socket.emit('customer-list-error', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      triggerReason
    });
  }
};

export const joinOrderRoom = (socketId: string, orderId: string) => io?.sockets.sockets.get(socketId)?.join(`order-${orderId}`);
export const leaveOrderRoom = (socketId: string, orderId: string) => io?.sockets.sockets.get(socketId)?.leave(`order-${orderId}`);
export const emitEvent = (event: string, payload: any) => io ? io.emit(event, payload) : console.warn(`Socket.IO not initialized. Event '${event}' not emitted.`);
export const emitNewOrder = (order: any) => emitEvent("new-order", order);