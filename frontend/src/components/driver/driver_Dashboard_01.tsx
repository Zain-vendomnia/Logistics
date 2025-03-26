import { useEffect, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

import useStyles from "./driver_Dashboard_style";
import LoadCargo from "./driver_LoadCargo";
import OrderShipping from "./driver_OrderShipping";
import TripData, { getTripData } from "../../services/trip_Service";
import ShippingDetails from "./driver_Shipping_Details";

import { Box, Button, Card, Stack } from "@mui/material";
import GoogleMaps from "./GoogleMaps";

const Dashboard01 = () => {
  const styles = useStyles;

  const mapCenter = {
    lat: -3.745,
    lng: -38.523,
  };

  const componentCheckList = [
    { name: "LoadCargo", component: LoadCargo },
    { name: "OrderShipping", component: OrderShipping },
    { name: "LoadCargo", component: LoadCargo },
  ];

  const [isComplied, setIsComplied] = useState(false);

  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );

  const [tripData, setTripData] = useState<TripData | null>(null);

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
    const data = await getTripData();
    setTripData(data);
  };

  const preTripChecks = (
    <Box sx={styles.cardsHolder}>
      <Stack spacing={1} pb={0}>
        {componentCheckList.map((item, index) => {
          if (componentStatus.lastIndexOf(true) + 1 === index) {
            const Component = item.component;
            return (
              <Card key={index} variant="outlined" sx={styles.cardLarge}>
                <Component
                  disabled={index !== 0 && !componentStatus[index - 1]}
                  onImageUpload={(result) => handleImageUpload(index, result)}
                  isMarkDone={componentStatus[index]}
                />
              </Card>
            );
          } else <Box></Box>;
        })}

        {!isComplied ? (
          <Box></Box>
        ) : (
          componentCheckList.map((item, index) => {
            const Component = item.component;
            return (
              <Card key={index} variant="outlined" sx={styles.cardHighlight}>
                <Component isMarkDone={componentStatus[index]} />
              </Card>
            );
          })
        )}

        <Button
          variant="contained"
          disabled={!isComplied}
          sx={styles.st_Button}
          onClick={startTrip}
        >
          Start Trip
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box display={"flex"} width={"100%"} height={"92vh"}>
      <Stack
        sx={styles.leftStack}
        border={!tripData ? "0.5px solid #e0e0e0" : "none"}
        borderRadius={!tripData ? "8px" : "0"}
      >
        {/* {!tripData ? preTripChecks : <ShippingDetails tripData={tripData} />} */}
      </Stack>

      {/* Google Map */}
      <Box flexGrow={1} width={"75%"} mx={0}>
        <GoogleMaps />
      </Box>
    </Box>
  );
};

export default Dashboard01;
