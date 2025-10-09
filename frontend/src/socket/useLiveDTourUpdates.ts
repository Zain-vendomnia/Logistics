import { useEffect } from "react";
import socket from "./socketInstance";
import { useNotificationStore } from "../store/useNotificationStore";
import { DynamicTourPayload } from "../types/tour.type";

const useLiveDTourUpdates = (
  onNewDTour: (dTour: DynamicTourPayload) => void
) => {
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket.connected) {
      console.log(`Creating Socket Connection - Order Updates`);
      socket.connect();
    }

    const handleNewDTour = (dTour: DynamicTourPayload) => {
      console.log("New Dynamic Tour Received: ", dTour);

      showNotification({
        title: "New Dynamic Tour",
        message: `A new dynamic tour has been created.\n ${dTour.tour_name}`,
        duration: 8000,
      });

      onNewDTour(dTour);
    };

    socket.on("new-dynamic-tour", handleNewDTour);

    return () => {
      console.log("Cleaning up socket connection - Order Updates");
      socket.off("new-dynamic-tour", handleNewDTour);
      socket.disconnect();
      console.log(`Socket disconnected with ID: ${socket.id} - Order Updates`);
    };
  }, [onNewDTour]);
};

export default useLiveDTourUpdates;
