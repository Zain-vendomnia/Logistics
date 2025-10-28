import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import config from "./config";

// Extend Socket interface to include custom properties
declare module "socket.io" {
  interface Socket {
    user?: any;
    userRole?: string;
    userId?: string;
  }
}

// Global socket instance
let io: Server;

/**
 * Initialize Socket.IO server with authentication middleware
 * @param app - Express application instance
 * @returns HTTP server with Socket.IO attached
 */
export const initSocket = (app: express.Application) => {
  const server = http.createServer(app);
  
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token missing"));

    try {
      const decoded = jwt.verify(token, config.SECRET) as any;
      Object.assign(socket, {
        user: decoded,
        userId: decoded.id,
        userRole: decoded.role || "admin",
      });
      next();
    } catch (e) {
      next(new Error("Invalid authentication token"));
    }
  });

  return server;
};

/**
 * Get the Socket.IO instance
 * @returns Socket.IO server instance
 * @throws Error if Socket.IO is not initialized
 */
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/**
 * Emit event to a specific room
 * @param room - Room name
 * @param event - Event name
 * @param data - Data to emit
 */
export const emitToRoom = (room: string, event: string, data: any) =>
  io?.to(room).emit(event, data);

/**
 * Emit event to all connected clients
 * @param event - Event name
 * @param payload - Data to emit
 */
export const emitEvent = (event: string, payload: any) =>
  io
    ? io.emit(event, payload)
    : console.warn(`Socket.IO not initialized. Event '${event}' not emitted.`);

/**
 * Join a socket to a specific room
 * @param socketId - Socket ID
 * @param roomName - Room name to join
 */
export const joinRoom = (socketId: string, roomName: string) =>
  io?.sockets.sockets.get(socketId)?.join(roomName);

/**
 * Remove a socket from a specific room
 * @param socketId - Socket ID
 * @param roomName - Room name to leave
 */
export const leaveRoom = (socketId: string, roomName: string) =>
  io?.sockets.sockets.get(socketId)?.leave(roomName);

/**
 * Get information about a specific room
 * @param roomName - Room name
 * @returns Room information including connected clients
 */
export const getRoomInfo = (roomName: string) => {
  if (!io) return null;
  const room = io.sockets.adapter.rooms.get(roomName);
  return {
    roomName,
    connectedClients: room?.size || 0,
    clientIds: Array.from(room || []),
  };
};

/**
 * Emit event to a specific socket
 * @param socketId - Socket ID
 * @param event - Event name
 * @param data - Data to emit
 */
export const emitToSocket = (socketId: string, event: string, data: any) => {
  const socket = io?.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit(event, data);
  }
};

/**
 * Get socket instance by ID
 * @param socketId - Socket ID
 * @returns Socket instance or undefined
 */
export const getSocket = (socketId: string) => io?.sockets.sockets.get(socketId);