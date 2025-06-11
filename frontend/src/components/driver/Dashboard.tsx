import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Fab,
  Grid,
  IconButton,
  keyframes,
  Paper,
  Slide,
  Snackbar,
  Stack,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
// import GoogleMaps from "../common/GoogleMaps";

import ShippingDetails from "./Shipping_Details";
import Delivery from "../delivery/Delivery";
import PreTripChecks from "./PreTripChecks";

import useStyles from "./Dashboard_style";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { resetDeliveryStore } from "../../utils/resetDeliveryStore";
import DeliveryDrawer from "../delivery/Delivery_Drawer";

const Dashboard = () => {
  const styles = useStyles;

  const store = useDeliveryStore();
  const { tripData, deliveryCompleted, deliveryId, tripDetails } = store;

  const { isDeliveryStarted, handleDriverReachedToDestination } =
    useTripLifecycle();

  // const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);

  // Dev Helpers
  // const [showActiveDeliveryScenario, setShowActiveDeliveryScenario] =
  //   useState(true);

  // useEffect(() => {
  //   setShowActiveDeliveryScenario(true);
  // }, [store.scenarioKey, showActiveDeliveryScenario]);
  // const slideTransition = (props: any) => {
  //   return <Slide {...props} direction="left" />;
  // };

  // const snackbarAction = (
  //   <IconButton onClick={() => setShowActiveDeliveryScenario(false)}>
  //     <CloseIcon style={{ color: "#fff" }} />
  //   </IconButton>
  // );

  return (
    <Grid container spacing={0} height={"100%"} p={0}>
      <Grid
        size={{ xs: 4, md: 3, lg: 3 }}
        sx={styles.sideGrid}
        height={"100%"}
      >
        <Box
          position={"relative"}
          height={"100%"}
          // p={2}
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
      </Grid>

      {/* Maps */}
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        height={"100%"}
        size={{ xs: 8, md: 9, lg: 9 }}
      >
      <Box width={"100%"} height={"100%"}>
        <LeafletMaps
        destination={tripData ? tripData.destinationCoordinates : null} routePath={[]} />
       
      </Box>
      </Grid>

      {isDeliveryStarted && <DeliveryDrawer key={deliveryId} />}

      {/* Dev helpers */}
      {/* {showActiveDeliveryScenario && (
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={true}
          message={store.scenarioKey}
          slots={{ transition: slideTransition }}
          action={snackbarAction}
          sx={{ marginTop: 4 }}
          slotProps={{
            content: {
              sx: {
                bgcolor: "secondary.main",
                color: "white",
                mt: 0,
              },
            },
          }}
        />
      )}
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
      </Fab> */}
    </Grid>
  );
};

export default Dashboard;
