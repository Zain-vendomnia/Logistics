import { useState, useEffect, useCallback, useRef } from "react";
import socket from "./socketInstance";

/**
 * Hook to get real-time global unread message count
 * Handles reconnection automatically when socket disconnects
 */
const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const reconnectAttempted = useRef<boolean>(false);

  // Request fresh unread count from server
  const refreshUnreadCount = useCallback(() => {
    if (socket.connected) {
      socket.emit("unread:get-count");
    }
  }, []);

  // Connect and join admin room
  const connectAndJoin = useCallback(() => {
    if (!socket.connected) {
      console.log("🔄 useUnreadCount: Attempting to connect socket...");
      socket.connect();
    } else {
      // Already connected, just join admin room
      socket.emit("admin:join");
      refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    // Handle socket connection
    const handleConnect = () => {
      console.log("🔌 useUnreadCount: Socket connected");
      setIsConnected(true);
      reconnectAttempted.current = false;
      
      // Join admin room to receive updates
      socket.emit("admin:join");
      refreshUnreadCount();
    };

    // Handle socket disconnection - attempt reconnect
    const handleDisconnect = (reason: string) => {
      console.log("🔌 useUnreadCount: Socket disconnected, reason:", reason);
      setIsConnected(false);
      
      // Auto-reconnect if disconnected (except if server closed connection)
      if (reason === "io client disconnect" || reason === "io server disconnect") {
        // Manual disconnect or server kicked - try to reconnect after delay
        if (!reconnectAttempted.current) {
          reconnectAttempted.current = true;
          console.log("🔄 useUnreadCount: Will attempt reconnect in 1 second...");
          setTimeout(() => {
            connectAndJoin();
          }, 1000);
        }
      }
      // For other reasons, socket.io will auto-reconnect
    };

    // Handle unread count updates from server
    const handleUnreadCount = (data: { totalUnreadCount: number; timestamp: string }) => {
      console.log("📬 Unread count received:", data.totalUnreadCount);
      setUnreadCount(data.totalUnreadCount);
    };

    // Handle customer reorder (new message received)
    const handleCustomerReorder = () => {
      console.log("🔄 Customer reorder event - refreshing unread count");
      refreshUnreadCount();
    };

    // Handle customer read updated (messages marked as read)
    const handleReadUpdated = () => {
      console.log("✅ Customer read updated - refreshing unread count");
      refreshUnreadCount();
    };

    // Handle reconnect event
    const handleReconnect = () => {
      console.log("🔄 useUnreadCount: Socket reconnected");
      setIsConnected(true);
      socket.emit("admin:join");
      refreshUnreadCount();
    };

    // Register event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleReconnect);
    socket.on("unread:count", handleUnreadCount);
    socket.on("customer:reorder", handleCustomerReorder);
    socket.on("customer:read-updated", handleReadUpdated);

    // Initial connection
    connectAndJoin();

    // Cleanup listeners on unmount (but DON'T disconnect socket)
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
      socket.off("unread:count", handleUnreadCount);
      socket.off("customer:reorder", handleCustomerReorder);
      socket.off("customer:read-updated", handleReadUpdated);
    };
  }, [refreshUnreadCount, connectAndJoin]);

  // Periodic check - if socket is disconnected, try to reconnect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!socket.connected) {
        console.log("⏰ useUnreadCount: Periodic check - socket not connected, reconnecting...");
        connectAndJoin();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [connectAndJoin]);

  return {
    unreadCount,
    isConnected,
    refreshUnreadCount,
    reconnect: connectAndJoin,
  };
};

export default useUnreadCount;