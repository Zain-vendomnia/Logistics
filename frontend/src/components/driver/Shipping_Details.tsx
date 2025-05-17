import { useState, useEffect } from "react";
import {
  Box,
  Divider,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import { TripData } from "../../services/trip_Service";
import useStyles from "./Shipping_Details_styles";
import ClientDetails from "../communications/Client_Details";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import ButtonAnimated from "../common/ButtonAnimated";
import ButtonStyled from "../common/ButtonStyled";
import { FormatUnderlined } from "@mui/icons-material";

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
  const store = useDeliveryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hideNotify, setHideNotify] = useState(false);
  // const [showOrderReached, setShowOrderReached] = useState(false);

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
      showNotification({
        message: "Notification sent to customer",
        severity: NotificationSeverity.Info,
      });

      onNotified(true);
    }, 1500);
  };

  const handleButtonReached = () => {
    onReachedToDestination(true);
  };

  if (!tripData) return null;
  return (
    <Stack width="100%" height="100%">
      <Box display={"flex"} flexDirection={"column"} width="100%" height="100%">
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
                    {tripData?.orderId}
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
          {/* <Divider color={grey[100]} /> */}
          {/* <Box
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
          {isArrived && <ClientDetails />}

          {notifyCustomer && (
            <Box
              display={"flex"}
              flexDirection={"column"}
              gap={2}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Button
                variant="contained"
                hidden={hideNotify}
                onClick={notify}
                className={styles.notifyButton}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={36} color="inherit" />
                    <Typography
                      sx={
                        isLoading
                          ? {
                              position: "absolute",
                              pointerEvents: "none",
                              opacity: 0.5,
                            }
                          : {}
                      }
                    >
                      {"Notify Customer"}
                    </Typography>
                  </>
                ) : (
                  "Notify Customer"
                )}
              </Button>
            </Box>
          )}
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
