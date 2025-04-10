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
  Container,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PinDropIcon from "@mui/icons-material/PinDrop";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import CloseIcon from "@mui/icons-material/Close";

import TripData from "../../services/trip_Service";
import useStyles from "./Shipping_Details_styles";
import { useSnackbar } from "../../providers/SnackbarProvider";
import PostTripChecks from "./PostTripChecks";

interface Props {
  tripData: TripData | null;
  isArrived?: boolean;
  notifyCustomer?: boolean;
  onNotified: (customerNotified: boolean) => void;
  isOrderReached?: boolean;
  onMarkedReached?: (isReached: boolean) => void;
}

const ShippingDetails = ({
  tripData,
  isArrived = false,
  notifyCustomer = false,
  onNotified,
  isOrderReached = false,
  onMarkedReached: onMarkedComplete,
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
  const [showOrderReached, setShowOrderReached] = useState(false);

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
      {!showOrderReached ? (
        <Box
          display={"flex"}
          flexDirection={"column"}
          width="100%"
          height="100%"
        >
          <Typography variant={"h5"} fontWeight={"bold"}>
            Ongoing Delivery
          </Typography>
          <Box
            display={"flex"}
            flexDirection={"column"}
            gap={3}
            pt={1}
            height="100%"
          >
            <Box
              display={"flex"}
              alignItems={"flex-start"}
              justifyContent={"space-between"}
            >
              {/* 1st Block */}
              <Box
                display={"flex"}
                flexDirection={"column"}
                gap={1}
                width={"100%"}
              >
                <Box
                  display={"flex"}
                  alignItems={"flex-start"}
                  justifyContent={"space-between"}
                  width="100%"
                >
                  <Container disableGutters>
                    <Typography variant="body1">Order number</Typography>
                    <Typography variant="h6" fontWeight={"bold"}>
                      {tripData?.shippingId}
                    </Typography>
                  </Container>
                  <Box
                    component="img"
                    src="/cargo.png"
                    alt="cargo"
                    sx={{ width: 90, height: 60 }}
                  />
                </Box>

                <Container disableGutters>
                  <Typography variant="body1">Item name</Typography>
                  <Typography variant="body1" fontWeight={"bold"}>
                    SUNNIVA® Balkonkraftwerk
                  </Typography>
                  <Typography variant="body1" color={grey[600]}>
                    Fragile Cargo
                  </Typography>
                </Container>
              </Box>
            </Box>
            {/* 2nd Block */}
            {/* <Divider color={grey[100]} />
            <Box
              display={"flex"}
              alignItems={"flex-start"}
              justifyContent={"space-between"}
            >
              <Stack spacing={2}>
                <Box display={"flex"} alignItems={"center"} gap={2}>
                  <MyLocationIcon fontSize="small" sx={{ color: "#16C47F" }} />
                  <Typography variant="body2">
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
            </Box> */}

            <Divider color={grey[100]} />
            {/* 3rd Block */}
            {isArrived && (
              <Stack spacing={2}>
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
                  <Box display={"flex"} gap={0} mx={0}>
                    <IconButton
                      onClick={() => setShowMessageBox(!showMessageBox)}
                      color="primary"
                    >
                      <CommentIcon fontSize="large" />
                    </IconButton>

                    <IconButton onClick={() => {}} color="primary">
                      <CallIcon fontSize="large" />
                    </IconButton>
                  </Box>
                </Box>
                {showMessageBox && (
                  <Box className={styles.messageBox}>
                    <Box
                      display={"flex"}
                      alignItems={"center"}
                      justifyContent={"space-between"}
                      borderRadius={1}
                      mb={1}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={"bold"}
                        color={grey[900]}
                      >
                        Send Message
                      </Typography>
                      <IconButton
                        onClick={() => setShowMessageBox(false)}
                        sx={{ color: "grey.900" }}
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
              </Stack>
            )}

            {/* Notification Button */}
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

          {isOrderReached && !showOrderReached && (
            <Button
              variant="contained"
              onClick={() => setShowOrderReached(true)}
              sx={{ mt: "auto", bgcolor: "primary.dark" }}
            >
              Reached
            </Button>
          )}
        </Box>
      ) : (
        <PostTripChecks
          isReachedToDestination={(isReached) => {
            setShowOrderReached(isReached);
            onMarkedComplete?.(isReached);
          }}
        />
      )}
    </Stack>
  );
};

export default ShippingDetails;
