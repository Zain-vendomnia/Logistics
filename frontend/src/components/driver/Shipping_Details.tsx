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
import { motion } from "framer-motion";
import { useShakeEvery } from "../base - ui/useShakeEvery";
import ParkingPetmitRequest from "../delivery/ParkingPetmitRequest";

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

  const { key, animation } = useShakeEvery(true);

  if (!tripData) return null;
  return (
    <Stack width="100%" height="100%" p={{ md: 1, lg: 2, xl: 3 }}>
      <Box display={"flex"} flexDirection={"column"} width="100%" height="100%">
        <Typography variant={"h5"} fontWeight={"bold"} pb={1}>
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
                  <Typography variant="h5" fontWeight={"bold"}>
                    Order number
                  </Typography>
                  <Typography variant="body1">{tripData?.orderId}</Typography>
                </Container>
                <Box
                  component="img"
                  src="/cargo.png"
                  alt="cargo"
                  sx={{ width: 90, height: 60 }}
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

              <Typography
                variant="body2"
                color={grey[600]}
                sx={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                Fragile Cargo
              </Typography>
            </Box>
          </Box>
          <Divider color={grey[100]} />

          {isArrived && <ClientDetails />}

          {!tripData.hasPermit && <ParkingPetmitRequest />}

          {/* {notifyCustomer && (
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
                  <motion.h5 key={key} animate={animation}>
                    Notify Customer
                  </motion.h5>
                )}
              </Button>

              <motion.div variants={fade} initial="hidden" animate="visible">
                <motion.h2 variants={slideUp}>Animated Heading</motion.h2>
                <motion.p variants={shake} initial='initial' animate='animate'>
                  This paragraph shakes once on mount
                </motion.p>
              </motion.div>

              <motion.div variants={bounce} initial="iniital" animate="animate">
                🔁 Bounce
              </motion.div>
              <motion.div variants={pulse} animate="animate">
                🔁 I'm pulsing
              </motion.div>
            </Box>
          )} */}
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
