import { useState, useEffect } from "react";
import {
  Box,
  Divider,
  Button,
  Stack,
  Typography,
  Container,
  Avatar,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import { TripData } from "../../services/trip_Service";
import useStyles from "./Shipping_Details_styles";
import ClientDetails from "../communications/Client_Details";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { useShakeEvery } from "../base - ui/useShakeEvery";
import ParkingPermitRequest from "../delivery/ParkingPermitRequest";

interface Props {
  tripData: TripData | null;
  isArrived?: boolean;
  notifyCustomer?: boolean;
  onNotified: (customerNotified: boolean) => void;
  isOrderReached?: boolean;
  onReachedToDestination: (isReached: boolean) => void;
}

const ShippingDetails = ({
  tripData,
  isArrived = false,
  notifyCustomer = false,
  onNotified,
  isOrderReached = false,
  onReachedToDestination,
}: Props) => {
  const styles = useStyles();
  const { showNotification } = useNotificationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hideNotify, setHideNotify] = useState(false);
  // const [showOrderReached, setShowOrderReached] = useState(false);

  useEffect(() => {
    if (!hideNotify) return;

    const timer = setTimeout(() => {
      setHideNotify(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [hideNotify]);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      setHideNotify((prev) => !prev);
      showNotification({
        message: "Notification sent to customer",
        severity: NotificationSeverity.Info,
      });
      onNotified(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const notify = () => {
    setIsLoading(true);
  };

  const handleButtonReached = () => {
    onReachedToDestination(true);
  };

  if (!tripData) return null;
  return (
    <Stack width="100%" height="100%">
      <Box
        display={"flex"}
        flexDirection={"column"}
        width="100%"
        height="100%"
        gap={2}
      >
        {/* Driver Details */}
        <Box display={"flex"} gap={3} alignItems={"center"}>
          <Avatar
            alt="client_image"
            src="https://cdn.vectorstock.com/i/1000v/00/74/young-man-profile-vector-14770074.avif"
            style={{
              width: "86px",
              height: "86px",
            }}
          />

          <Stack spacing={0}>
            <Typography variant="body1" fontWeight={"bold"} color={grey[800]}>
              Hallo Fahrer!
            </Typography>
            {/* <Typography variant="body1" fontSize={"large"}>
                {tripData?.client.name}
              </Typography> */}
          </Stack>
        </Box>
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={2}
          pt={1}
          height="100%"
        >
          {/* Order Delivery */}
          <Box
            display={"flex"}
            alignItems={"flex-start"}
            justifyContent={"space-between"}
          >
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
                position="relative"
                gap={2}
              >
                <Container disableGutters>
                  <Typography variant="h5" fontWeight={"bold"}>
                    Order number
                  </Typography>
                  <Typography variant="body1">{tripData?.orderId}</Typography>
                </Container>
                <Box
                  component="img"
                  src="/cargo.png"
                  alt="cargo"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "8vw",
                    height: "12vh",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box
                display={"flex"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Box>
                  <Typography variant="h5" fontWeight={"bold"}>
                    Model
                  </Typography>
                  <Typography variant="body1">{tripData.model}</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={"bold"}>
                    Quantity
                  </Typography>

                  <Typography variant="body1">
                    {tripData.quantity} Pcs
                  </Typography>
                </Box>
              </Box>

              {/* <Typography
                variant="body2"
                color={grey[600]}
                sx={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                Solar Modules
              </Typography> */}
            </Box>
          </Box>

          <Divider color={grey[100]} />

          <ParkingPermitRequest />

          {isArrived && <ClientDetails />}
        </Box>

        {/* {isOrderReached && !showOrderReached && ( */}
        {isOrderReached && (
          <Button
            variant="contained"
            onClick={handleButtonReached} //setShowOrderReached(true)}
            sx={{ mt: "auto", bgcolor: "primary.dark" }}
          >
            Reached
          </Button>
        )}
      </Box>
    </Stack>
  );
};

export default ShippingDetails;
