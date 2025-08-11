import { useEffect } from "react";
import socket from "./socketInstance";

const useLiveOrderUpdates = (onNewOrder: (order: any) => void) => {
  useEffect(() => {
    if (!socket.connected) {
      console.log(`Creating Socket Connection - Order Updates`);
      socket.connect();
    }

    const handleNewOrder = (order: any) => {
      console.log("New Order Received: ", order);
      onNewOrder(order);
    };

    socket.on("new-order", handleNewOrder);

    return () => {
      console.log("Cleaning up socket connection - Order Updates");
      socket.off("new-order", handleNewOrder);
      socket.disconnect();
      console.log(`Socket disconnected with ID: ${socket.id} - Order Updates`);
    };
  }, [onNewOrder]);
};

export default useLiveOrderUpdates;
