import { useEffect, useState } from "react";

import { Box, Button, Card, Grid2, Stack, Typography } from "@mui/material";

import useStyles from "./Dashboard_style";
import TripData, { getTripData } from "../../services/trip_Service";
import CheckBoxItem from "../common/CheckBoxItem";
import ShippingDetails from "./Shipping_Details";
import { useSnackbar } from "../../providers/SnackbarProvider";
import LeafletMaps from "../common/leaflet_Map/Leaflet_Maps";
import GoogleMaps from "../common/GoogleMaps";

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
  const [tripData, setTripData] = useState<TripData | null>(null);
  // const [loadOrderComplete, setLoadOrderComplete] = useState(true);

  useEffect(() => {
    // startTrip();
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
    const data = await getTripData();
    setTripData(data);
  };

  const preTripChecks = (
    <Stack spacing={1}>
      {componentCheckList.map(
        (item, index) =>
          componentStatus.lastIndexOf(true) + 1 === index && (
            <Card key={index} variant="outlined" sx={styles.cardLarge}>
              <CheckBoxItem
                title={item.title}
                description={item.description}
                showCameraIcon={true}
                disabled={index !== 0 && !componentStatus[index - 1]}
                onImageUpload={(result) => handleImageUpload(index, result)}
                isMarkDone={componentStatus[index]}
              />
            </Card>
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
          {!tripData ? (
            preTripChecks
          ) : (
            <ShippingDetails
              tripData={tripData}
              isArrived={true}
              notifyCustomer={true}
              onNotified={(result) =>
                console.log("Driver Pressed Notify Button", result)
              }
              isOrderReached={true} // loadOrderComplete}
              onMarkedReached={() =>
                console.log("Order Completed by Driver...")
              }
            />
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
    </Grid2>
  );
};

export default Dashboard;
