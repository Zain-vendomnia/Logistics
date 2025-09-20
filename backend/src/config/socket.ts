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
      origin: "*", // Client path - localhost:8081
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token misssing"));
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
    // socket.id - a unique identifier for the connected client device

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return server;
};

export const emitEvent = (event: string, payload: any) => {
  if (!io) {
    console.warn(` Socket.IO not iniitalized. Event '${event}' not emitted.`);
    return;
  }

  io.emit(event, payload);
  console.log(`Event emitted: ${event}`, payload);
};

// newOrder event emitter
export const emitNewOrder = (order: any) => {
  emitEvent("new-order", order);
};
