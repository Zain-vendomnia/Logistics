import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { motion } from "framer-motion";

import { useShakeEvery } from "../base - ui/useShakeEvery";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";

const ParkingPetmitRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hideNotify, setHideNotify] = useState(false);

  const { showNotification } = useNotificationStore();

  const { key, animation } = useShakeEvery(true);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      setHideNotify((prev) => !prev);
      showNotification({
        message: "Notification sent to customer",
        severity: NotificationSeverity.Info,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const notify = () => {
    setIsLoading(true);
  };

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h6">Send Parking Permit Form</Typography>
        <Box display="flex" justifyContent={"space-evenly"}>
          <Button
            variant="contained"
            // hidden={hideNotify}
            onClick={notify}
            sx={{
              minWidth: 90,
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={24} color="inherit" />
                <Typography
                  sx={
                    isLoading
                      ? {
                          position: "absolute",
                          pointerEvents: "none",
                          opacity: 0.5,
                          transition: "opacity 0.3s",
                        }
                      : {}
                  }
                >
                  Email
                </Typography>
              </>
            ) : (
              <motion.div key={key} animate={animation}>
                Email
              </motion.div>
            )}
          </Button>
          <Button variant="contained">WhatsApp</Button>
        </Box>
        <Divider color={grey[100]} />
      </Stack>
    </>
  );
};

export default ParkingPetmitRequest;
