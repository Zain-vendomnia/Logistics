import { io, Socket } from "socket.io-client";
import { getCurrentUser } from "../services/auth.service";

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:8080";

let token = getCurrentUser()?.accessToken || "";

const socket: Socket = io(SOCKET_URL, {
  autoConnect: true, // no conn. until socket.connect()
  auth: { token },
  transports: ["websocket"],
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

export const setSocketAuthToken = (newToken: string) => {
  token = newToken;
  socket.auth = { token };
};

export default socket;
