import { useEffect, useState } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";

import { motion } from "framer-motion";

import { useShakeEvery } from "../base - ui/useShakeEvery";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { useDeliveryStore } from "../../store/useDeliveryStore";

const ParkingPermitRequest = () => {
  const tripData = useDeliveryStore((s) => s.tripData);

  const [isLoading, setIsLoading] = useState(false);
  const [isReqSentOnce, setIsReqSentOnce] = useState(false);

  const { showNotification } = useNotificationStore();

  const { key, animation } = useShakeEvery(true);

  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      setIsLoading(false);
      showNotification({
        message: "Notification sent to customer",
        severity: NotificationSeverity.Info,
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isLoading, showNotification]);

  const notifyParkingPermit = async () => {
    setIsLoading(true);
    setIsReqSentOnce(true);

    // Email
    // WhatsApp
    // SMS

    // adminApiService is not merged with the current codebase.
    // try {
    //   await adminApiService.picklistEmail({
    //     to: " ",
    //     subject: "Parking Permit Request",
    //     //  html,
    //     //  attachment,
    //     //  attachment_name
    //   });
    //   setIsLoading(false);
    // } catch (error) {
    //   setIsLoading(false);
    // }
  };

  return (
    <>
      {tripData?.hasPermit ? (
        <>
          <Box display="flex" justifyContent={"flex-end"} mb={4}>
            <Box
              sx={{
                position: "absolute",
                // top: -10,
                right: -8,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                // my: 1,
                p: 1,
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
                color: "white",
                bgcolor: "rgb(0, 150, 136)",
                boxShadow: 1,
              }}
            >
              <LabelImportantIcon />
              <Typography variant="body2">Parking Permit Available</Typography>
            </Box>
          </Box>
        </>
      ) : (
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={"bold"}>
            Parking Permit Form
          </Typography>
          <Box display="flex" justifyContent={"space-evenly"}>
            <Button
              variant="contained"
              loading={isLoading}
              disabled={isLoading}
              onClick={notifyParkingPermit}
              sx={{
                minWidth: 90,
              }}
            >
              {!isReqSentOnce ? (
                <motion.div key={key} animate={animation}>
                  Parkerlaubnis senden
                </motion.div>
              ) : (
                "Parkerlaubnis gesendet"
              )}
            </Button>
          </Box>
          <Divider color={grey[100]} />
        </Stack>
      )}
    </>
  );
};

export default ParkingPermitRequest;
