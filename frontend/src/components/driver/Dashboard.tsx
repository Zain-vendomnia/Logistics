import { useEffect, useState } from "react";

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  Fab,
  Grid2,
  IconButton,
  keyframes,
  Paper,
  Slide,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";

import { useSnackbar } from "../../providers/SnackbarProvider";
import ShippingDetails from "./Shipping_Details";
import Delivery from "../delivery/Delivery";

import useStyles from "./Dashboard_style";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
import {
  defaultDeliveryStoreState,
  useDeliveryStore,
} from "../../store/useDeliveryStore";
import CameraCapture from "../common/Camera_Capture";
import DeliveryDrawer from "../delivery/Delivery_Drawer";
import { DeliveryScenario } from "../delivery/delieryScenarios";
import { resetDeliveryStore } from "../../utils/resetDeliveryStore";
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
    fetchTripData,
    ordersReturnToWareHouse,
    updateDeliveryState,
    setScenario,
  } = useDeliveryStore();
  const ordersDeliveredSuccessfully = useDeliveryStore(
    (s) => s.ordersDeliveredSuccessfully
  );

  const [isFabClicked, setIsFabClicked] = useState(false);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);

  const [showActiveDeliveryScenario, setShowActiveDeliveryScenario] =
    useState(true);

  const [isReachedToDestination, setIsReachedToDestination] = useState(true);
  const [isTripStarted, setIsTripStarted] = useState(false);

  const [isDeliveryStarted, setIsDeliveryStarted] = useState(false);

  const startNewTrip = () => {
    const currentOrderId = tripData?.orderId;

    // Check if order exists and is not setteled
    const isTripHandled =
      currentOrderId &&
      (ordersDeliveredSuccessfully.includes(currentOrderId) ||
        ordersReturnToWareHouse.includes(currentOrderId));

    // console.log("isTripHandled: ", isTripHandled);

    const shouldLoadNewTrip =
      deliveryCompleted === true || !tripData || isTripHandled;

    if (shouldLoadNewTrip) {
      fetchTripData()
        .then((data) => {
          // setIsReachedToDestination(false);
          setIsDeliveryStarted(false);
          // Avoid adding newTrip data to OrdersDelivered Array
          store.setDeliveryCompleted(false);
          store.resetDeliveryState();
          store.resetActionsCompleted();
          console.log("🚚 New Order Id:: ", data.orderId);

          data.hasPermit === true
            ? setScenario(data.orderId, DeliveryScenario.hasPermit)
            : setScenario(data.orderId, DeliveryScenario.foundCustomer);
        })
        .catch((err) => {
          showSnackbar(err.message ?? err, "error");
        });
    }
  };

  useEffect(() => {
    if (tripData && deliveryCompleted === false) {
      tripData.hasPermit === true
        ? setScenario(deliveryId, DeliveryScenario.hasPermit)
        : setScenario(deliveryId, DeliveryScenario.foundCustomer);
    }
    console.log("trip data", tripData);
    startNewTrip();
    console.log("🚚 Delivery#: ", store.deliveryInstanceKey);
    console.log("🚚 Order Id: ", deliveryId);
    console.log(
      "🚚 Orders Delivered Successfully:",
      ordersDeliveredSuccessfully
    );
  }, [deliveryCompleted, deliveryId]);

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  useEffect(() => {
    setShowActiveDeliveryScenario(true);
  }, [store.scenarioKey, showActiveDeliveryScenario]);

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
    updateDeliveryState({ driverReachedToLocation: true });
    // showSnackbar("Reached to delivery location", "info");
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

  const resetPersistence = () => {
    useDeliveryStore.persist?.clearStorage();
    useDeliveryStore.setState(defaultDeliveryStoreState);
    useDeliveryStore.persist?.rehydrate();
    console.log("Delivery storage reset");
  };

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
            destination={tripData ? tripData.destinationCoordinates : null} routePath={[]}          />
          {/* burj Khalifa: [25.1972, 55.2744] */}
        </Box>
      </Grid2>

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
