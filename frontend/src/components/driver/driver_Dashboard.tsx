import { useEffect, useState } from "react";
import GoogleMaps from "./GoogleMaps";
import LeafletMaps from "./leaflet_Map/Leaflet_Maps";

import useStyles from "./driver_Dashboard_style";
import TripData, { getTripData } from "../../services/trip_Service";
import ShippingDetails from "./driver_Shipping_Details";

import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import CheckBoxItem from "./driver_CheckBoxItem";

const Dashboard = () => {
  const styles = useStyles;

  const componentCheckList = [
    {
      title: "Load Cargo",
      description: "Ensure all items are laoded on the truck and take a photo.",
    },
    {
      title: "OrderShipping",
      description: "Kilometers Driven and Fuel Guage photo from the odometer.",
    },
    {
      title: "Gas Check",
      description: "Check gas level before start the trip.",
    },
  ];

  const [isComplied, setIsComplied] = useState(false);
  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );
  const [tripData, setTripData] = useState<TripData | null>(null);

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    checkLocation();
    checkCamera();
  }, []);

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  const checkLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          showSnackbar("GPS is enabled");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setOpenLocationDialog(true);
          }
        }
      );
    } else {
      setOpenLocationDialog(true);
    }
  };

  const enableLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser");
      return;
    }

    const checkPermissionAndLocation = () => {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (
            permissionStatus.state === "granted" ||
            permissionStatus.state === "prompt"
          ) {
            navigator.geolocation.getCurrentPosition(
              () => {
                setLocationEnabled(true);
                setOpenLocationDialog(false);
                showSnackbar("GPS is enabled");
              },
              () => {
                setOpenLocationDialog(true);
              }
            );
          } else {
            showSnackbar(
              "Location access is blocked. Enable it in browser settings."
            );
            setOpenLocationDialog(true);
          }
        });
    };

    checkPermissionAndLocation();

    // const intervalId = setInterval(() => {
    //   if (!locationEnabled) checkPermissionAndLocation();
    //   else clearInterval(intervalId);
    // }, 5000);
  };

  const checkCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraEnabled(true);
      showSnackbar("Camera is functional");
    } catch (error) {
      setOpenCameraDialog(true);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

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
        {componentCheckList.map(
          (item, index) =>
            componentStatus.lastIndexOf(true) + 1 === index && (
              <Card key={index} variant="outlined" sx={styles.cardLarge}>
                <CheckBoxItem
                  title={item.title}
                  description={item.description}
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
          disabled={!isComplied}
          sx={styles.st_Button}
          onClick={startTrip}
        >
          Start Trip
        </Button>
      </Stack>
    </Box>
  );
  // const preTripChecks = (
  //   <Box sx={styles.cardsHolder}>
  //     <Stack spacing={1} pb={0}>
  //       {componentCheckList.map((item, index) => {
  //         const Component = item.component;
  //         return (
  //           <Card
  //             key={index}
  //             variant="outlined"
  //             sx={
  //               componentStatus.lastIndexOf(true) + 1 === index ||
  //               componentStatus[index]
  //                 ? styles.cardHighlight
  //                 : styles.cardBody
  //             }
  //           >
  //             <Component
  //               disabled={index !== 0 && !componentStatus[index - 1]}
  //               onImageUpload={(result) => handleImageUpload(index, result)}
  //               isMarkDone={componentStatus[index] ? true : false}
  //             />
  //           </Card>
  //         );
  //       })}
  //       <Button
  //         variant="contained"
  //         disabled={!isComplied}
  //         sx={styles.st_Button}
  //         onClick={startTrip}
  //       >
  //         Start Trip
  //       </Button>
  //     </Stack>
  //   </Box>
  // );

  return (
    <Box display={"flex"} width={"100%"} height={"92vh"} position="relative">
      <Stack
        sx={styles.leftStack}
        border={!tripData ? "0.5px solid #e0e0e0" : "none"}
        borderRadius={!tripData ? "8px" : "0"}
      >
        {!tripData ? preTripChecks : <ShippingDetails tripData={tripData} />}
      </Stack>

      {/* Google Map */}
      <Box flexGrow={1} width={"75%"} mx={0}>
        <LeafletMaps destination={null} />
        {/* [24.4895, 54.3567] */}
        {/* <GoogleMaps /> */}
      </Box>

      {/* Location Dialog */}
      {
        <Dialog
          open={openLocationDialog}
          onClose={() => setOpenLocationDialog(false)}
        >
          <DialogTitle>Enable GPS</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enable GPS to continue.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={enableLocation} color="primary" autoFocus>
              Enable GPS
            </Button>
          </DialogActions>
        </Dialog>
      }

      <Dialog
        open={openCameraDialog}
        onClose={() => setOpenCameraDialog(false)}
      >
        <DialogTitle>Camara Not Functional!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The camera is not detedted. Please check your camera settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCameraDialog(false)}
            color="primary"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
        sx={{ "& .MuiSnackbarContent-root": { backgroundColor: "green" } }}
      /> */}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ minWidth: "250px", mt: 4 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Overlay */}
      {!locationEnabled && !cameraEnabled && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={9999}
          display="flex"
          justifyContent="center"
          alignItems="center"
          color="white"
          fontSize="24px"
        >
          Please enable GPS and Camera to continue.
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
