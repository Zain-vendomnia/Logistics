import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  Grid2,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useSnackbar } from "../../providers/SnackbarProvider";
import { TripData, getTripData } from "../../services/trip_Service";
import ShippingDetails from "./Shipping_Details";
import Delivery from "./Delivery";

import useStyles from "./Dashboard_style";
import CheckBoxItem from "../common/CheckBoxItem";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryScenario } from "../common/delieryScenarios";
import { useStore } from "zustand";
import DeliveryCompleteOverlay from "../common/DeliveryCompleteOverlay";
import CameraCapture from "../common/Camera_Capture";
// import GoogleMaps from "../common/GoogleMaps";

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
  const {
    deliveryId,
    setScenario,
    fetchTripData,
    ordersDeliveredSuccessfully,
    ordersReturnToWareHouse,
    addOrdersDeliveredSuccessfully,
  } = useDeliveryStore();

  // const [tripData, setTripData] = useState<TripData | null>(null);
  // const [loadOrderComplete, setLoadOrderComplete] = useState(true);

  const [isReachedToDestination, setIsReachedToDestination] = useState(false);
  const [isTripStarted, setIsTripStarted] = useState(false);

  useEffect(() => {
    console.log("Order Id:: ", deliveryId);
    console.log("Order Delivery Completed:: ", deliveryCompleted);
    console.log("Orders Completed:: ", ordersDeliveredSuccessfully);

    const resetDashboard = () => {
      const currentOrderId = tripData?.orderId;

      // Add order to delivered orders Array if it's completed.
      if (
        deliveryCompleted === true &&
        currentOrderId &&
        !ordersDeliveredSuccessfully.includes(currentOrderId)
      ) {
        addOrdersDeliveredSuccessfully(currentOrderId);
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
            // Scenario Switcher
            setScenario(data.orderId, DeliveryScenario.hasPermit);
            // setTripData(data);
            console.log("New Order Id:: ", data.orderId);
            setIsReachedToDestination(false);
          })
          .catch((err) => {
            showSnackbar(err.message ?? err, "error");
          });
      }
    };

    resetDashboard();
  }, [
    tripData,
    deliveryCompleted,
    setScenario,
    fetchTripData,
    ordersDeliveredSuccessfully,
    ordersReturnToWareHouse,
    addOrdersDeliveredSuccessfully,
    showSnackbar,
    deliveryId,
  ]);

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  const handleImageUpload = (index: number, isImageUplaoded: boolean) => {
    console.log("isImageUplaoded Parent: ", isImageUplaoded);
    console.log("Image Uploaded for Component at: ", index);
    setComponentStatus((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      console.log(newState);
      return newState;
    });
  };

  const startTrip = async () => {
    const data = await fetchTripData();
    setScenario(`${data.orderId}`, DeliveryScenario.foundCustomer);

    setIsTripStarted(true);

    console.log("Trip started 1st time:: ", deliveryId);

    // setTripData(data);
    // store.deliveryId = data?.orderId;
  };

  const handleReachedToDestination = () => {
    setIsReachedToDestination(true);
    showSnackbar("You have now readched to destination.", "info");
    console.log("Driver reached to destination...::");
  };
  const preTripChecks = (
    <Stack spacing={1}>
      {componentCheckList.map(
        (item, index) =>
          componentStatus.lastIndexOf(true) + 1 === index && (
            <CameraCapture
              // styleCard={true}
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
            <CheckBoxItem
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
        onClick={startTrip}
        sx={{
          ...styles.st_Button,
          bgcolor: "primary.dark",
        }}
      >
        Start Trip
      </Button>
    </Stack>
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
          ) : isReachedToDestination ? (
            <Delivery />
          ) : (
            <ShippingDetails
              key={deliveryId}
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
      <DeliveryCompleteOverlay />
    </Grid2>
  );
};

export default Dashboard;
