import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  Fab,
  Grid2,
  keyframes,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";

import { useSnackbar } from "../../providers/SnackbarProvider";
import ShippingDetails from "./Shipping_Details";
import Delivery from "../delivery/Delivery";

import useStyles from "./Dashboard_style";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryScenario } from "../delivery/delieryScenarios";
import CameraCapture from "../common/Camera_Capture";
import DeliveryDrawer from "../delivery/Delivery_Drawer";
// import GoogleMaps from "../common/GoogleMaps";

const blinkOverlay = keyframes`
   0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
  100% { opacity: 0.7; transform: scale(1); }
`;

const Dashboard = () => {
  const { showSnackbar } = useSnackbar();

  const styles = useStyles;

  const componentCheckList = [
    {
      title: "Load Cargo",
      description: "Ensure all items are laoded on the truck and take a photo.",
    },
    {
      title: "Order Shipping",
      description: "Kilometers Driven and Fuel Guage photo from the odometer.",
    },
  ];
  const [isComplied, setIsComplied] = useState(false);
  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );

  const store = useDeliveryStore();
  const tripData = useDeliveryStore((s) => s.tripData);
  const deliveryCompleted = useDeliveryStore((s) => s.deliveryCompleted);
  const deliveryId = useDeliveryStore((s) => s.deliveryId);
  const {
    setScenario,
    fetchTripData,
    ordersReturnToWareHouse,
    addOrdersDeliveredSuccessfully,
  } = useDeliveryStore();
  const ordersDeliveredSuccessfully = useDeliveryStore(
    (s) => s.ordersDeliveredSuccessfully
  );

  // const [tripData, setTripData] = useState<TripData | null>(null);
  // const [loadOrderComplete, setLoadOrderComplete] = useState(true);

  const [isFabClicked, setIsFabClicked] = useState(false);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);
  const [isReachedToDestination, setIsReachedToDestination] = useState(true);
  const [isTripStarted, setIsTripStarted] = useState(false);

  const [isDeliveryStarted, setIsDeliveryStarted] = useState(false);

  const startNewTrip = () => {
    console.log("Delivery Instance Key:: ", store.deliveryInstanceKey);
    const currentOrderId = tripData?.orderId;

    // Store previous trip info BEFORE attemping to fetch new trip
    const prevTripCompleted = deliveryCompleted;
    const prevTripId = deliveryId;

    const isPrevTripUnrecordedSuccess =
      prevTripCompleted &&
      prevTripId &&
      !ordersDeliveredSuccessfully.includes(prevTripId);

    if (isPrevTripUnrecordedSuccess) {
      addOrdersDeliveredSuccessfully(prevTripId);
      // Set deliveryCompelted after fetchTripData,
      // to avoid getting same data from cache.
      console.log("Added to ordersDeliveredSuccessfully::", prevTripId);
    }

    // Check if order exists and is not setteled
    const isTripHandled =
      currentOrderId &&
      (ordersDeliveredSuccessfully.includes(currentOrderId) ||
        ordersReturnToWareHouse.includes(currentOrderId));

    console.log("isTripHandled:: ", isTripHandled);

    const shouldLoadNewTrip =
      deliveryCompleted === true || !tripData || isTripHandled;

    if (shouldLoadNewTrip) {
      fetchTripData()
        .then((data) => {
          // setScenario(data.orderId, DeliveryScenario.hasPermit);
          // setIsReachedToDestination(false);
          setIsDeliveryStarted(false);
          // Avoid adding newTrip data to OrdersDelivered Array
          store.setDeliveryCompleted(false);
          store.resetActionsCompleted();
          console.log("🚚 New Order Id:: ", data.orderId);
        })
        .catch((err) => {
          showSnackbar(err.message ?? err, "error");
        });
    }
  };

  useEffect(() => {
    startNewTrip();

    console.log("Orders Delivered Successfully::", ordersDeliveredSuccessfully);
    console.log("Order Id:: ", deliveryId);
    console.log("Is Order Delivery Completed:: ", deliveryCompleted);
  }, [deliveryCompleted]);

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  const handleImageUpload = (index: number, isImageUplaoded: boolean) => {
    setComponentStatus((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  const handleReachedToDestination = () => {
    setIsReachedToDestination(true);
    setIsDeliveryStarted(true);
    showSnackbar("Reached to delivery location", "info");
  };

  const preTripChecks = (
    <Stack spacing={1}>
      {componentCheckList.map(
        (item, index) =>
          componentStatus.lastIndexOf(true) + 1 === index && (
            <CameraCapture
              key={index}
              title={item.title}
              description={item.description}
              buttonText={"Upload Image"}
              showCameraIcon={true}
              buttonDisabled={index !== 0 && !componentStatus[index - 1]}
              onComplete={(result: boolean) => handleImageUpload(index, result)}
              isMarkDone={componentStatus[index]}
            />
          )
      )}

      {isComplied &&
        componentCheckList.map((item, index) => (
          <Card key={index} variant="outlined" sx={styles.cardHighlight}>
            <CameraCapture
              styleCard={false}
              title={
                <Typography variant="h5" fontWeight="bold">
                  {item.title}
                </Typography>
              }
              isMarkDone={componentStatus[index]}
            />
          </Card>
        ))}

      <Button
        variant="contained"
        disabled={isComplied}
        onClick={() => {
          startNewTrip();
          setIsTripStarted(true);
        }}
        sx={{
          ...styles.st_Button,
          bgcolor: "primary.dark",
        }}
      >
        Start Trip
      </Button>
    </Stack>
  );

  const getFab = (
    <>
      <Tooltip title="Delivey Options">
        <Fab
          onClick={() => {
            setIsFabClicked(true);
            setShowDeliveryDrawer(!showDeliveryDrawer);
          }}
          color="primary"
          aria-label="open delivery drawer"
          sx={{
            position: "absolute",
            top: 70,
            right: showDeliveryDrawer ? 255 : 8,
            zIndex: 1500,
            transition: "right 0.3s ease-in-out",
            animation: !isFabClicked ? `${blinkOverlay} 1.5s infinite` : "none",
          }}
        >
          <KeyboardDoubleArrowLeftIcon
            sx={{
              transform: showDeliveryDrawer ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.7s",
            }}
          />
        </Fab>
      </Tooltip>
      <DeliveryDrawer
        open={showDeliveryDrawer}
        onClose={() => setShowDeliveryDrawer(!showDeliveryDrawer)}
        onScenarioSelected={handleReachedToDestination}
      />
    </>
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
          {!isTripStarted ? (
            preTripChecks
          ) : isDeliveryStarted ? (
            <Delivery />
          ) : (
            <ShippingDetails
              key={`${deliveryId}`}
              tripData={tripData}
              isArrived={true}
              notifyCustomer={true}
              onNotified={(result) =>
                console.log("Driver Pressed Notify Button", result)
              }
              isOrderReached={true} // loadOrderComplete}
              onReachedToDestination={handleReachedToDestination}
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

      {/* {getFab} */}
      {isReachedToDestination && getFab}
    </Grid2>
  );
};

export default Dashboard;
