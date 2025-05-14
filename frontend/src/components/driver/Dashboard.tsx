import { useEffect, useState } from "react";

import {
  Box,
  Fab,
  Grid2,
  IconButton,
  keyframes,
  Paper,
  Slide,
  Snackbar,
  Stack,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";

import { useSnackbar } from "../../providers/SnackbarProvider";
import ShippingDetails from "./Shipping_Details";
import Delivery from "../delivery/Delivery";

import useStyles from "./Dashboard_style";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryScenario } from "../delivery/delieryScenarios";
import { resetDeliveryStore } from "../../utils/resetDeliveryStore";
import PreTripChecks from "./PreTripChecks";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
// import GoogleMaps from "../common/GoogleMaps";

const Dashboard = () => {
  const { showSnackbar } = useSnackbar();

  const styles = useStyles;

  const store = useDeliveryStore();
  const {
    tripData,
    deliveryCompleted,
    deliveryId,
    tripDetails,
    setScenario,
    ordersReturnToWareHouse,
    ordersDeliveredSuccessfully,
  } = store;

  const { isDeliveryStarted, startNewTrip, handleDriverReachedToDestination } =
    useTripLifecycle();

  // useEffect(() => {
  //   console.log("TripData Changed");
  //   if (tripData && !deliveryCompleted) {
  //     console.log("TripData Changed 0000");
  //     tripData.hasPermit === true
  //       ? setScenario(deliveryId, DeliveryScenario.hasPermit)
  //       : setScenario(deliveryId, DeliveryScenario.foundCustomer);
  //   }
  // }, [
  //   tripData,
  //   deliveryId,
  //   deliveryCompleted,
  //   ordersDeliveredSuccessfully,
  //   ordersReturnToWareHouse,
  //   setScenario,
  // ]);

  // useEffect(() => {
  //   console.log("trip data", tripData);
  //   startNewTrip();
  //   console.log("🚚 Delivery#: ", store.deliveryInstanceKey);
  //   console.log("🚚 Order Id: ", deliveryId);
  //   console.log(
  //     "🚚 Orders Delivered Successfully:",
  //     ordersDeliveredSuccessfully
  //   );
  // }, [deliveryCompleted, deliveryId]);

  const [showActiveDeliveryScenario, setShowActiveDeliveryScenario] =
    useState(true);
  useEffect(() => {
    setShowActiveDeliveryScenario(true);
  }, [store.scenarioKey, showActiveDeliveryScenario]);

  const SlideTransition = (props: any) => {
    return <Slide {...props} direction="left" />;
  };
  const snackbarAction = (
    <IconButton onClick={() => setShowActiveDeliveryScenario(false)}>
      <CloseIcon style={{ color: "#fff" }} />
    </IconButton>
  );

  return (
    <Grid2 container spacing={0} height={"100%"} p={0}>
      <Grid2
        size={{ xs: 4, md: 3, lg: 3 }}
        sx={styles.sideGrid}
        height={"100%"}
      >
        <Box
          position={"relative"}
          height={"100%"}
          p={2}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 2,
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

          {deliveryCompleted ?? (
            <Paper sx={{ m: 1, width: 100, height: 100 }} elevation={4}>
              <svg>
                <Box
                  component="polygon"
                  points="0,100 50,00, 100,100"
                  sx={(theme) => ({
                    fill: theme.palette.common.white,
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                  })}
                />
              </svg>
            </Paper>
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
          />
          {/* burj Khalifa: [25.1972, 55.2744] */}
        </Box>
      </Grid2>

      {/* Dev helpers */}
      <Fab
        onClick={resetDeliveryStore}
        color="primary"
        aria-label="open delivery drawer"
        sx={{
          position: "absolute",
          bottom: 10,
          right: 8,
          zIndex: 1500,
        }}
      >
        <ClearAllIcon
          sx={{
            transform: isDeliveryStarted ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.7s",
          }}
        />
      </Fab>
      {showActiveDeliveryScenario && (
        <Stack spacing={8}>
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={true}
            message={store.scenarioKey}
            slots={{ transition: SlideTransition }}
            action={snackbarAction}
            sx={{ marginTop: 4 }}
            // onClose={() => setShowActiveDeliveryScenario(false)}
            slotProps={{
              content: {
                sx: {
                  bgcolor: "info.dark",
                  color: "white",
                  mt: 3,
                },
              },
            }}
          />
        </Stack>
      )}
    </Grid2>
  );
};

export default Dashboard;
