import { useState, useEffect } from "react";
import {
  Box,
  Chip,
  Divider,
  Button,
  IconButton,
  ImageListItem,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PinDropIcon from "@mui/icons-material/PinDrop";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import CloseIcon from "@mui/icons-material/Close";

import TripData from "../../services/trip_Service";
import useStyles from "./driver_Shipping_Details_styles";
import { useSnackbar } from "../../providers/SnackbarProvider";
import OrderComplete from "./driver_OrderComplete";

interface Props {
  tripData: TripData | null;
  isArrived?: boolean;
  notifyCustomer?: boolean;
  onNotified: (customerNotified: boolean) => void;
  isLoadOrderComplete?: boolean;
  onMarkedComplete?: (isComplete: boolean) => void;
}

const ShippingDetails = ({
  tripData,
  isArrived = false,
  notifyCustomer = false,
  onNotified,
  isLoadOrderComplete = false,
  onMarkedComplete,
}: Props) => {
  const styles = useStyles();
  const { showSnackbar } = useSnackbar();

  const quickMessages = [
    "Arriving soon",
    "I'm nearby",
    "I'm arrived",
    "At your doorstep",
  ];

  const [showMessageBox, setShowMessageBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hideNotify, setHideNotify] = useState(false);
  const [showOrderComplete, setShowOrderComplete] = useState(false);

  useEffect(() => {
    if (hideNotify === true) {
      setTimeout(() => {
        setHideNotify(false);
      }, 3000);
    }
  }, [hideNotify]);

  const notify = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setHideNotify((prev) => !prev);
      showSnackbar("Notification sent to customer", "info");
      onNotified(true);
    }, 1500);
  };

  if (!tripData) return null;
  return (
    <Stack width="100%" height="100%">
      {!showOrderComplete ? (
        <Box
          display={"flex"}
          flexDirection={"column"}
          width="100%"
          height="100%"
        >
          <Typography variant={"h5"}>Ongoing Delivery</Typography>
          <Box
            display={"flex"}
            flexDirection={"column"}
            gap={3}
            p={1}
            height="100%"
          >
            <Box
              display={"flex"}
              alignItems={"flex-start"}
              justifyContent={"space-between"}
            >
              <Box display={"flex"} flexDirection={"column"}>
                <Typography
                  variant="body1"
                  fontStyle={"small"}
                  color={grey[600]}
                >
                  Order number
                </Typography>
                <Typography variant="h6">{tripData?.shippingId}</Typography>
                <Typography
                  variant="body1"
                  fontStyle={"small"}
                  color={grey[600]}
                >
                  Item name
                </Typography>
                <Typography variant="body2">
                  SUNNIVA® Balkonkraftwerk
                </Typography>
                <Typography
                  variant="body2"
                  fontSize={"small"}
                  color={grey[500]}
                >
                  Fragile Cargo
                </Typography>
              </Box>
              <Box
                component="img"
                src="/cargo.png"
                alt="cargo"
                sx={{ width: 90, height: 60, borderRadius: "8px" }}
              />
            </Box>
            <Divider color={grey[100]} />
            <Box
              display={"flex"}
              alignItems={"flex-start"}
              justifyContent={"space-between"}
            >
              <Stack spacing={2}>
                <Box display={"flex"} alignItems={"center"} gap={2}>
                  <MyLocationIcon fontSize="small" sx={{ color: "#16C47F" }} />
                  <Typography variant="body2">
                    {" "}
                    {tripData?.startPoint}
                  </Typography>
                </Box>

                <Box display={"flex"} alignItems={"center"} gap={2}>
                  <PinDropIcon fontSize="small" color="primary" />
                  <span>
                    {tripData?.client.address.includes(",") ? (
                      (() => {
                        const address = tripData.client.address.split(",");
                        return (
                          <>
                            <Typography variant="body2">
                              {address[1]}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontSize={"small"}
                              color={grey[700]}
                            >
                              {address[0]}
                            </Typography>
                          </>
                        );
                      })()
                    ) : (
                      <Typography>{tripData?.client.address}</Typography>
                    )}
                  </span>
                </Box>
              </Stack>
              <Box mx={1}>
                <Typography variant="body2"> Postal Code </Typography>
                <Typography variant="body1">00000</Typography>
              </Box>
            </Box>
            <Divider color={grey[100]} />
            {isArrived && (
              <Box
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Box display={"flex"} gap={2}>
                  <ImageListItem>
                    <img
                      src="https://cdn.vectorstock.com/i/1000v/00/74/young-man-profile-vector-14770074.avif"
                      alt="client_image"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                      }}
                    />
                  </ImageListItem>
                  <Stack spacing={0}>
                    <Typography variant="body1" color={grey[600]}>
                      Customer
                    </Typography>
                    <Typography variant="body1" fontSize={"large"}>
                      {" "}
                      {tripData?.client.name}
                    </Typography>
                  </Stack>
                </Box>
                <Box display={"flex"} gap={1} mx={1}>
                  <IconButton
                    onClick={() => setShowMessageBox(!showMessageBox)}
                    color="primary"
                  >
                    <CommentIcon fontSize="medium" />
                  </IconButton>

                  <IconButton onClick={() => {}} color="primary">
                    <CallIcon fontSize="medium" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {isArrived && showMessageBox && (
              <Box className={styles.messageBox}>
                <Box
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  borderRadius={1}
                  mb={2}
                >
                  <Typography variant="body1" color={grey[700]}>
                    Send Message
                  </Typography>
                  <IconButton
                    onClick={() => setShowMessageBox(false)}
                    sx={{ color: "grey.700" }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {quickMessages.map((item) => (
                  <Chip
                    label={item}
                    key={item}
                    variant="outlined"
                    className={styles.chip}
                  />
                ))}
              </Box>
            )}

            {notifyCustomer && (
              <Box display={"flex"} justifyContent={"center"}>
                <Button
                  variant="contained"
                  hidden={hideNotify}
                  onClick={notify}
                  className={styles.notifyButton}
                >
                  {isLoading ? (
                    <CircularProgress size={36} color="inherit" />
                  ) : (
                    "Notify Customer"
                  )}
                </Button>
              </Box>
            )}
          </Box>

          {isLoadOrderComplete && !showOrderComplete && (
            <Button
              variant="contained"
              onClick={() => setShowOrderComplete(true)}
              sx={{ mt: "auto", fontSize: "1.05rem" }}
            >
              Complete
            </Button>
          )}
        </Box>
      ) : (
        <OrderComplete
          onComplete={(isCompleted) => {
            setShowOrderComplete(isCompleted);
            onMarkedComplete?.(isCompleted);
          }}
        />
      )}
    </Stack>
  );
};

export default ShippingDetails;
