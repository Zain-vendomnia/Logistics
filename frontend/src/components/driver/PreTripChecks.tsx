import { Box, Button, Card, Stack, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import CameraCapture from "../common/Camera_Capture";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import CustomInputField from "../delivery/CustomInputField";
import { ImageType } from "../../hooks/useCameraCapture";

const useStyle = {
  cardHighlight: {
    height: { xs: "auto", md: "auto", lg: "25vh" },
    p: "20px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "primary.main",
    borderRadius: "10px",
  },
  st_Button: {
    width: "90%",
    mt: 2,
    position: "absolute",
    bottom: "20px",
    left: "50%",
    mx: "auto",
    transform: "translateX(-50%)",
    "&.Mui-disabled": {
      backgroundColor: "greyedOut",
      color: "#FFFFFF",
    },
  },
};
type ComponentCheckListItem = {
  title: string;
  description: string;
  requiredInputValue?: boolean;
  imageType: ImageType;
};
const componentCheckList: ComponentCheckListItem[] = [
  {
    title: "Load Cargo",
    description: "Ensure all items are laoded on the truck and take a photo.",
    imageType: ImageType.LoadCargo_TripStart,
  },
  {
    title: "Order Shipping",
    description: "Kilometers Driven and Fuel Guage photo from the odometer.",
    requiredInputValue: true,
    imageType: ImageType.Millage_TripStart,
  },
];

const PreTripChecks = () => {
  const styles = useStyle;

  const { tripDetails, updateTripDetails } = useDeliveryStore();

  const { startNewTrip } = useTripLifecycle();

  const [isComplied, setIsComplied] = useState(false);
  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );

  const [millageInputValue, setMillageInputValue] = useState("");

  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (
      componentStatus.every((state) => state === false) &&
      !tripDetails.isTripStarted
    ) {
      showNotification({
        message: "New Trip Started!",
        severity: NotificationSeverity.Info,
      });
    }
  }, [componentStatus, tripDetails.isTripStarted, showNotification]);

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  const handleImageUpload = (index: number, isImageUplaoded: boolean) => {
    console.log("image done!!!");
    setComponentStatus((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  const handleStartTripButton = () => {
    startNewTrip();
    updateTripDetails({
      isTripStarted: true,
      tripStartedAt: new Date().toUTCString(),
    });
    console.log("Compliances completed, Trip hass starts now.");
  };

  return (
    <Stack spacing={1}>
      {componentCheckList.map(
        (item, index) =>
          componentStatus.lastIndexOf(true) + 1 === index && (
            <Stack
              key={index}
              spacing={4}
              sx={{
                p: 2,
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: "primary.main",
                borderRadius: 2,
              }}
            >
              <Box display="flex" flexDirection={"column"} gap={1}>
                <Typography variant="h5" fontWeight="bold">
                  {item.title}
                </Typography>
                <Typography variant="body1" fontSize={"1.1rem"}>
                  {item.description}
                </Typography>
              </Box>

              {item.requiredInputValue && (
                <CustomInputField
                  label="Km's driven"
                  placeholder="000000000"
                  onChange={(value) => {
                    setMillageInputValue(value);
                    console.log(value);
                  }}
                />
              )}

              <CameraCapture
                imageType={item.imageType}
                millage={millageInputValue ?? null}
                // title={item.title}
                // description={item.description}
                styleCard={false}
                buttonText={"Upload Image"}
                showCameraIcon={true}
                buttonDisabled={
                  index !== 0 && !componentStatus[index - 1]
                  // !inputValue && !componentStatus[index - 1]
                }
                onComplete={(result: boolean) =>
                  handleImageUpload(index, result)
                }
                isMarkDone={componentStatus[index]}
              />
            </Stack>
          )
      )}

      {isComplied &&
        componentCheckList.map((item, index) => (
          <Card key={index} variant="outlined" sx={styles.cardHighlight}>
            <Stack spacing={3}>
              <CameraCapture
                imageType={item.imageType}
                styleCard={false}
                title={
                  <Typography variant="h5" fontWeight="bold">
                    {item.title}
                  </Typography>
                }
                isMarkDone={componentStatus[index]}
              />

              {item.requiredInputValue && (
                <CustomInputField
                  label="Km's driven"
                  placeholder="000000000"
                  value={millageInputValue}
                  isDisabled={true}
                />
              )}
            </Stack>
          </Card>
        ))}

      <Button
        variant="contained"
        disabled={!isComplied}
        onClick={handleStartTripButton}
        sx={{
          ...styles.st_Button,
          bgcolor: "primary.dark",
        }}
      >
        Start Trip
      </Button>
    </Stack>
  );
};

export default PreTripChecks;
