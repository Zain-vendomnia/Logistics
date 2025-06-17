import { useEffect, Suspense } from "react";
import { Box } from "@mui/material";
import TripComplete from "./TripComplete";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import Dashboard from "./Dashboard";
import { lazyWithDevFallback } from "../../utils/lazyload";
const DriverDashboard = lazyWithDevFallback(
  () => import("./Dashboard"),
  Dashboard
);

const BoardDriver = () => {
  const { tripDetails, deliveryInstanceKey, deliveryId, updateTripDetails } =
    useDeliveryStore();

  useEffect(() => {
    console.log("Delivery instance key:", deliveryInstanceKey);
    // if (deliveryId === "M1") {
    if (deliveryInstanceKey >= 14) {
      console.log("Trip completed at:", new Date().toUTCString());
      //     // Trip complete simulation

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
          {/* <TripComplete /> */}
          {tripDetails.isTripCompleted ? (
            <TripComplete />
          ) : (
            // <Dashboard />
            <Suspense fallback={<Box>Loading dashboard data...</Box>}>
              <DriverDashboard />
            </Suspense>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BoardDriver;
