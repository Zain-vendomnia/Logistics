import { useEffect } from "react";
import socket from "./socketInstance";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";
import { DynamicTourPayload } from "../types/tour.type";
import useDynamicTourStore from "../store/useDynamicTourStore";

const useLiveDTourUpdates = (
  onNewDTour: (dTour: DynamicTourPayload) => void
) => {
  const { dynamicToursList } = useDynamicTourStore();

  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket.connected) {
      console.log(`Creating Socket Connection - Order Updates`);
      socket.connect();
    }

    const handleNewDTour = (dTour: DynamicTourPayload) => {
      console.log("New Dynamic Tour Received: ", dTour);

      const existing = dynamicToursList.some(
        (tour) => tour.tour_name === dTour.tour_name
      );

      if (existing) {
        showNotification({
          title: "New Dynamic Tour",
          message: `Tour has been Updated.\n ${dTour.tour_name}`,
          duration: 8000,
          severity: NotificationSeverity.Warning,
        });
      } else {
        showNotification({
          title: "New Dynamic Tour",
          message: `A new dynamic tour has been created.\n ${dTour.tour_name}`,
          duration: 8000,
        });
      }

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
