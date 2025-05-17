import { useEffect } from "react";
import { Box } from "@mui/material";
import Dashboard from "./Dashboard";
import TripComplete from "./TripComplete";
import { useDeliveryStore } from "../../store/useDeliveryStore";

const BoardDriver = () => {
  const { tripDetails, deliveryInstanceKey, deliveryId, updateTripDetails } =
    useDeliveryStore();

  useEffect(() => {
    // if (deliveryId === "M1") {
    if (deliveryInstanceKey >= 3) {
      updateTripDetails({
        isTripCompleted: true,
        tripCompletedAt: new Date().toUTCString(),
      });
    }
    // updateTripDetails({ isTripCompleted: false });
  }, [deliveryInstanceKey]);

  return (
    <Box display="flex" height="100%" width="100%">
      <Box flexGrow={1} overflow={"hidden"} height="100%">
        <Box height="100%">
          {tripDetails.isTripCompleted ? <TripComplete /> : <Dashboard />}
        </Box>
      </Box>
    </Box>
  );
};

export default BoardDriver;
