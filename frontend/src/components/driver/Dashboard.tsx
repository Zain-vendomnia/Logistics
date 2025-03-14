import { useEffect, useState } from "react";
import { Box, Button, Card, Fade, Stack } from "@mui/material";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import useStyles from "./Dashboard_style";
import LoadCargo from "./LoadCargo";
import OrderShipping from "./OrderShipping";

const Dashboard = () => {
  const styles = useStyles;

  const mapCenter = {
    lat: -3.745,
    lng: -38.523,
  };

  const [isComplied, setIsComplied] = useState(false);

  const componentCheckList = [
    { name: "LoadCargo", component: LoadCargo },
    { name: "LoadCargo", component: LoadCargo },
    { name: "OrderShipping", component: OrderShipping },
  ];

  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);

    const lastTureIndex = componentStatus.lastIndexOf(true);
    console.log("Last True Index: ", lastTureIndex);
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

  return (
    <Box display={"flex"} width={"100%"} height={"91vh"}>
      <Stack direction="row" spacing={1} width={"25%"} mr={1}>
        <Box sx={styles.cardsHolder}>
          <Stack spacing={1} pb={6}>
            {componentCheckList.map((item, index) => {
              const Component = item.component;
              return (
                <Card
                  key={index}
                  variant="outlined"
                  sx={
                    // componentStatus[index]
                    //   ? styles.cardHighlight
                    //   : styles.cardBody

                    componentStatus.lastIndexOf(true) + 1 === index
                      ? styles.cardHighlight
                      : styles.cardBody
                  }
                >
                  <Component
                    disabled={index !== 0 && !componentStatus[index - 1]}
                    onImageUpload={(result) => handleImageUpload(index, result)}
                    isMarkDone={componentStatus[index] ? true : false}
                  />
                </Card>
              );
            })}
            <Button
              variant="contained"
              disabled={!isComplied}
              sx={styles.st_Button}
            >
              Start Trip
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Google Map */}
      <Box flexGrow={1} width={"75%"} mx={0}>
        <LoadScript googleMapsApiKey="AIzaSyBP2Ij-7iyGs46fzSnRVipyg1_QMaznZJU">
          <GoogleMap
            mapContainerStyle={styles.mapContainerStyle}
            center={mapCenter}
            zoom={10}
          >
            {/* Child components, such as markers, info windows, etc. */}
          </GoogleMap>
        </LoadScript>
      </Box>
    </Box>
  );
};

export default Dashboard;
