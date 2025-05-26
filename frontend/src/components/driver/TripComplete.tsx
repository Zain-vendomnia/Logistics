import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PublishIcon from "@mui/icons-material/Publish";

import Camera from "../common/Camera";

import { resetDeliveryStore } from "../../utils/resetDeliveryStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import CustomInputField from "../delivery/CustomInputField";
import { ImageType } from "../../hooks/useCameraCapture";

type ImageChecklistItem = {
  title: string;
  imageType: ImageType;
  requiredInputValue?: boolean;
};

const imageChecklist: ImageChecklistItem[] = [
  { title: "Truck Image", imageType: ImageType.TruckImage_TripEnd },
  {
    title: "Odometer Image",
    imageType: ImageType.Millage_TripEnd,
    requiredInputValue: true,
  },
  { title: "Fuel Receipt", imageType: ImageType.GasReceipt },
];

const TripComplete = () => {
  const iconSize = "6rem";

  const [millageValue, setMillageValue] = useState<string>("");
  const [shouldShowInputField, setShouldShowInputField] = useState(false);
  const [showInputFieldAlert, setShowInputFieldAlert] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [componentStatus, setComponentStatus] = useState<boolean[]>(
    new Array(imageChecklist.length).fill(false)
  );
  const [isAllComplied, setIsAllComplied] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);

  useEffect(() => {
    const requiresInput = imageChecklist[currentIndex]?.requiredInputValue;

    if (requiresInput) {
      setShouldShowInputField(requiresInput);
      setIsCameraDisabled(requiresInput);
      if (millageValue.length > 1) {
        setIsCameraDisabled(false);
      } else {
        setIsCameraDisabled(true);
      }
    } else {
      setIsCameraDisabled(false);
      setShouldShowInputField(false);
    }

    if (showInputFieldAlert) {
      setShowInputFieldAlert(false);
    }
  }, [currentIndex, millageValue, showInputFieldAlert]);

  useEffect(() => {
    if (componentStatus.every((s) => s === true)) {
      setIsAllComplied(true);
    }
    console.log("Current Index", currentIndex);
    console.log("Component Status: ", componentStatus);
  }, [componentStatus]);

  const handleImageUploaded = (value: boolean) => {
    if (value) {
      setComponentStatus((prevState) => {
        const updated = [...prevState];
        updated[currentIndex] = true;
        return updated;
      });
      if (currentIndex < imageChecklist.length) {
        setCurrentIndex((v) => v + 1);
      }
    }
  };

  const handleInputValue = (value: string) => {
    setMillageValue(value);
  };
  const { showNotification } = useNotificationStore();

  const handleTripComplete = () => {
    setTimeout(() => {
      resetDeliveryStore();
    }, 2000);

    showNotification({
      message: "Trip completed!",
      severity: NotificationSeverity.Success,
    });
  };

  const debouncedcallRef = useRef(0);
  const checkCameraEnable = () => {
    if (!shouldShowInputField) return;

    const currentCall = Date.now();

    if (currentCall - debouncedcallRef.current < 4000) return;

    if (shouldShowInputField && !millageValue) {
      showNotification({
        message:
          "Please enter the odometer reading before uploading the image.",
        severity: NotificationSeverity.Warning,
      });
      setShowInputFieldAlert(true);

      debouncedcallRef.current = currentCall;
    }
  };

  return (
    <Grid2 container spacing={0} p={0} height={"100%"}>
      <Grid2 height={"100%"} bgcolor={"#00695f"} size={{ sm: 8, md: 9, lg: 9 }}>
        <Box
          height="100%"
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Stack spacing={4} p={4} height={"100%"}>
            {shouldShowInputField && (
              <Box display={"flex"} width="100%">
                <CustomInputField
                  label="Km's driven"
                  placeholder="000000000"
                  blinkAlert={showInputFieldAlert}
                  onChange={handleInputValue}
                />
              </Box>
            )}

            <Box height={"100%"} onClick={checkCameraEnable}>
              <Box
                sx={{
                  height: "100%",
                  pointerEvents: "auto",
                  ...(shouldShowInputField &&
                    !millageValue && {
                      cursor: "not-allowed",
                      pointerEvents: "none",
                      opacity: 0.5,
                    }),
                }}
              >
                <Camera
                  type={imageChecklist[currentIndex].imageType}
                  millage={millageValue ?? null}
                  buttonText={
                    imageChecklist[currentIndex]?.title ?? "Upload Image"
                  }
                  isComplied={isAllComplied}
                  onImageUploaded={handleImageUploaded}
                />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Grid2>
      <Grid2 height={"100%"} bgcolor={"#009688"} size={{ sm: 4, md: 3, lg: 3 }}>
        <Stack
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-evenly"}
          height={"100%"}
          py={4}
        >
          {imageChecklist.map((item, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection={"column"}
              justifyContent={"center"}
              alignItems={"center"}
              gap={1}
            >
              <IconButton>
                <Box
                  sx={{
                    perspective: 1000,
                    width: "6rem",
                    height: "6rem",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.9s",
                      transform: componentStatus[index]
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: "primary",
                        borderRadius: "50%",
                        // backgroundColor: "#00695f",
                        boxShadow: 3,
                      }}
                    >
                      <PublishIcon sx={{ fontSize: iconSize }} />
                    </Box>

                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // border: "1px solid",
                        // borderColor: "primary.main",
                        borderRadius: "50%",
                        backgroundColor: "#00695f",
                        boxShadow: 3,
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: iconSize }} />
                    </Box>
                  </Box>
                </Box>
              </IconButton>
              <Typography variant="h5">{item.title}</Typography>
            </Box>
          ))}

          <Button
            disabled={!isAllComplied}
            variant="contained"
            onClick={handleTripComplete}
            sx={{
              padding: "6px 12px",
              borderRadius: 2,
              width: "12rem",
              minWidth: 180,
              maxWidth: 240,
              height: "4rem",
            }}
          >
            Complete
          </Button>
        </Stack>
      </Grid2>
    </Grid2>
  );
};

export default TripComplete;
