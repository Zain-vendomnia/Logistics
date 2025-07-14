import { useEffect } from "react";

import { Box, Grid2 } from "@mui/material";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
// import GoogleMaps from "../common/GoogleMaps";

import ShippingDetails from "./Shipping_Details";
import Delivery from "../delivery/Delivery";
import PreTripChecks from "./PreTripChecks";

import useStyles from "./Dashboard_style";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import DeliveryDrawer from "../delivery/Delivery_Drawer";
import OrientationOverlay from "../common/OrientationOverlay";
import { useDriverBreakStore } from "../../store/useDriverBreakStore";
import { BreakTimer } from "./BreakTimer";
import Dev_Helper from "./Dev_Helper";

const Dashboard = () => {
  const styles = useStyles;

  const store = useDeliveryStore();
  const { tripData, deliveryId, tripDetails } = store;

  const { isDeliveryStarted, handleDriverReachedToDestination } =
    useTripLifecycle();

  const {
    isBreakCancelled,
    isBreakActive,
    initializeBreakEvaluator,
    recoverBreakTimer,
  } = useDriverBreakStore();

  useEffect(() => {
    if (tripDetails.tripStartedAt && !isBreakCancelled) {
      initializeBreakEvaluator(tripDetails.tripStartedAt);
      recoverBreakTimer();
    }
  }, [tripDetails.tripStartedAt, isBreakCancelled]);

  return (
    <>
      {isBreakActive && <BreakTimer />}

      <Grid2 container spacing={0} height={"100%"} p={0}>
        {/* <BreakTimer /> */}

        {isDeliveryStarted && <DeliveryDrawer key={deliveryId} />}
        {/* <DeliveryDrawer key={deliveryId} /> */}

        <Grid2
          size={{ xs: 4, md: 3, lg: 3 }}
          sx={styles.sideGrid}
          height={"100%"}
        >
          <Box
            position={"relative"}
            height={"100%"}
            p={{ md: 0.5, lg: 1, xl: 2 }}
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              ...(isBreakActive && {
                pointerEvents: "none",
                opacity: 0.6,
                cursor: "wait",
              }),
            }}
          >
            {!tripDetails.isTripStarted ? (
              <PreTripChecks />
            ) : isDeliveryStarted ? (
              <Delivery key={`${deliveryId}`} />
            ) : (
              <ShippingDetails
                key={`${deliveryId}`}
                tripData={tripData}
                isArrived={true}
                notifyCustomer={true}
                onNotified={(result) =>
                  console.log("Driver Pressed Notify Button", result)
                }
                isOrderReached={true}
                onReachedToDestination={handleDriverReachedToDestination}
              />
            )}
          </Box>
        </Grid2>

        {/* Maps */}
        <Grid2
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          height={"100%"}
          size={{ xs: 8, md: 9, lg: 9 }}
        >
          <Box width={"100%"} height={"100%"}>
            <LeafletMaps
              destination={tripData ? tripData.destinationCoordinates : null}
              routePath={[]}
            />
          </Box>
        </Grid2>

        <OrientationOverlay />
      </Grid2>
    </>
  );
};

export default Dashboard;
