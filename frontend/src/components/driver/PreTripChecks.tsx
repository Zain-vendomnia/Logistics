import { Button, Card, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import CameraCapture from "../common/Camera_Capture";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifeycle";

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

const PreTripChecks = () => {
  const styles = useStyle;
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

  const { tripDetails, updateTripDetails } = useDeliveryStore();

  const { startNewTrip } = useTripLifecycle();

  const [isComplied, setIsComplied] = useState(false);
  const [componentStatus, setComponentStatus] = useState(
    new Array(componentCheckList.length).fill(false)
  );

  const handleImageUpload = (index: number, isImageUplaoded: boolean) => {
    setComponentStatus((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  const handleStartTripButton = () => {
    startNewTrip();
    updateTripDetails({ isTripStarted: true });
  };

  useEffect(() => {
    const isAllComplied = componentStatus.every((status) => status === true);
    setIsComplied(isAllComplied);
  }, [componentStatus]);

  return (
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
