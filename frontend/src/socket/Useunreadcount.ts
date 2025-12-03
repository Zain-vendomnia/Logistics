import { useState, useEffect, useCallback, useRef } from "react";
import socket from "./socketInstance";

/**
 * Hook to get real-time global unread message count
 * This hook maintains socket connection for NavBar badge
 * It re-joins admin room if another component leaves it
 */
const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const isJoined = useRef<boolean>(false);

  // Request fresh unread count from server
  const refreshUnreadCount = useCallback(() => {
    if (socket.connected) {
      socket.emit("unread:get-count");
    }
  }, []);

  // Join admin room
  const joinAdminRoom = useCallback(() => {
    if (socket.connected && !isJoined.current) {
      socket.emit("admin:join");
      isJoined.current = true;
      console.log("🔌 useUnreadCount: Joined admin room");
      refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  // Connect socket and join admin room
  const connectAndJoin = useCallback(() => {
    if (!socket.connected) {
      console.log("🔄 useUnreadCount: Connecting socket...");
      socket.connect();
    } else {
      joinAdminRoom();
    }
  }, [joinAdminRoom]);

  useEffect(() => {
    // Handle socket connection
    const handleConnect = () => {
      console.log("🔌 useUnreadCount: Socket connected");
      setIsConnected(true);
      isJoined.current = false; // Reset join state on new connection
      joinAdminRoom();
    };

    // Handle socket disconnection
    const handleDisconnect = (reason: string) => {
      console.log("🔌 useUnreadCount: Socket disconnected:", reason);
      setIsConnected(false);
      isJoined.current = false;

      // Auto-reconnect for manual disconnects
      if (reason === "io client disconnect") {
        setTimeout(() => {
          console.log("🔄 useUnreadCount: Reconnecting after manual disconnect...");
          connectAndJoin();
        }, 1000);
      }
    };

    // Handle unread count updates from server
    const handleUnreadCount = (data: { totalUnreadCount: number; timestamp: string }) => {
      console.log("📬 Unread count received:", data.totalUnreadCount);
      setUnreadCount(data.totalUnreadCount);
    };

    // Handle admin joined confirmation - means we're in the room
    const handleAdminJoined = () => {
      console.log("✅ useUnreadCount: Admin joined confirmed");
      isJoined.current = true;
      refreshUnreadCount();
    };

    // Handle customer reorder (new message received)
    const handleCustomerReorder = () => {
      console.log("🔄 useUnreadCount: Customer reorder - refreshing count");
      refreshUnreadCount();
    };

    // Handle customer read updated (messages marked as read)
    const handleReadUpdated = () => {
      console.log("✅ useUnreadCount: Read updated - refreshing count");
      refreshUnreadCount();
    };

    // Register event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("unread:count", handleUnreadCount);
    socket.on("admin:joined", handleAdminJoined);
    socket.on("customer:reorder", handleCustomerReorder);
    socket.on("customer:read-updated", handleReadUpdated);

    // Initial connection
    connectAndJoin();

    // Cleanup - remove listeners but DON'T disconnect or leave room
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("unread:count", handleUnreadCount);
      socket.off("admin:joined", handleAdminJoined);
      socket.off("customer:reorder", handleCustomerReorder);
      socket.off("customer:read-updated", handleReadUpdated);
    };
  }, [connectAndJoin, joinAdminRoom, refreshUnreadCount]);

  // Re-join admin room periodically if disconnected from room (but socket still connected)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket.connected && !isJoined.current) {
        console.log("⏰ useUnreadCount: Re-joining admin room...");
        joinAdminRoom();
      } else if (!socket.connected) {
        console.log("⏰ useUnreadCount: Socket not connected, reconnecting...");
        connectAndJoin();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [joinAdminRoom, connectAndJoin]);

  return {
    unreadCount,
    isConnected,
    refreshUnreadCount,
    reconnect: connectAndJoin,
  };
};

export default useUnreadCount;