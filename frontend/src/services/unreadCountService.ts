import { io, Socket } from "socket.io-client";
import authHeader from "./auth-header";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

class SocketService {
  private socket: Socket | null = null;
  private unreadCountCallbacks: ((count: number) => void)[] = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionPromise: Promise<boolean> | null = null;

  async connect(): Promise<boolean> {
    if (this.connectionPromise) return this.connectionPromise;
    if (this.socket?.connected) return true;

    this.connectionPromise = new Promise(async (resolve, reject) => {
      if (this.isConnecting) return resolve(false);

      const token = authHeader()["Authorization"]?.substring(7);
      if (!token) {
        console.error("No token found for socket connection");
        this.connectionPromise = null;
        return resolve(false);
      }

      this.isConnecting = true;
      this.cleanupSocket();

      this.socket = io(API_BASE, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: { token },
        transports: ["websocket", "polling"],
        forceNew: true,
        timeout: 10000,
      });

      const timeout = setTimeout(() => {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        this.socket?.emit("join-admin-room");
        this.setupEventListeners();
        resolve(true);
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        this.isConnecting = false;
        this.reconnectAttempts++;
        this.connectionPromise = null;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
        }
        reject(error);
      });
    });

    return this.connectionPromise;
  }

  private cleanupSocket() {
    if (!this.socket) return;
    // this.socket.removeAllListeners();
    // this.socket.disconnect();
    // this.socket = null;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const s = this.socket;

    s.on("admin-room-joined", () => s.emit("request-total-unread"));
    s.on("total-unread-update", (data) =>
      this.notifyUnreadCountCallbacks(data?.totalUnreadCount || 0)
    );
    s.on(
      "new-message",
      (msg) => msg.direction === "inbound" && s.emit("request-total-unread")
    );
    s.on("messages-read", () => s.emit("request-total-unread"));

    s.on("disconnect", (reason) => {
      if (reason === "io server disconnect")
        setTimeout(() => this.connect(), 1000);
    });

    s.on("reconnect", () => {
      this.reconnectAttempts = 0;
      s.emit("join-admin-room");
    });

    if (process.env.NODE_ENV === "development") {
      s.onAny((event, ...args) =>
        console.log("[DEV] Socket event:", event, args)
      );
    }
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.emit("leave-admin-room");
    this.cleanupSocket();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionPromise = null;
    this.unreadCountCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  joinOrder(orderId: number) {
    if (this.socket?.connected)
      this.socket.emit("join-order", orderId.toString());
  }

  leaveOrder(orderId: number) {
    if (this.socket?.connected)
      this.socket.emit("leave-order", orderId.toString());
  }

  async requestTotalUnreadCount() {
    if (this.socket?.connected) return this.socket.emit("request-total-unread");
    const connected = await this.connect();
    if (connected) this.socket?.emit("request-total-unread");
  }

  onUnreadCountUpdate(callback: (count: number) => void): () => void {
    this.unreadCountCallbacks.push(callback);
    this.connect().then(
      (connected) => connected && this.socket?.emit("request-total-unread")
    );
    return () => {
      const index = this.unreadCountCallbacks.indexOf(callback);
      if (index > -1) this.unreadCountCallbacks.splice(index, 1);
    };
  }

  private notifyUnreadCountCallbacks(count: number) {
    this.unreadCountCallbacks.forEach((cb) => {
      try {
        cb(count);
      } catch (e) {
        console.error("Unread callback error:", e);
      }
    });
  }

  onConnect(cb: () => void) {
    this.socket?.on("connect", cb);
  }
  offConnect(cb: () => void) {
    this.socket?.off("connect", cb);
  }
  onDisconnect(cb: (reason: string) => void) {
    this.socket?.on("disconnect", cb);
  }
  offDisconnect(cb: (reason: string) => void) {
    this.socket?.off("disconnect", cb);
  }
  getSocket(): Socket | null {
    return this.socket;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      callbackCount: this.unreadCountCallbacks.length,
      hasConnectionPromise: !!this.connectionPromise,
    };
  }
}

export const socketService = new SocketService();
