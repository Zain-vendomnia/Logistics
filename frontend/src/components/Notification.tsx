import { useEffect, useState } from "react";

import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  Slide,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  NotificationProp,
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";

const Notification = ({
  title,
  message,
  severity = NotificationSeverity.Info,
  icon,
  actions,
  duration,
  onComplete,
}: Omit<NotificationProp, "id">) => {
  const { showNotification: addNotification } = useNotificationStore();

  useEffect(() => {
    addNotification({ title, message, severity, icon, actions, duration });
    onComplete?.();
  }, []);

  return null;
};

export default Notification;

const getDefaultIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case NotificationSeverity.Success:
      return <SuccessIcon />;
    case NotificationSeverity.Warning:
      return <WarningIcon />;
    case NotificationSeverity.Error:
      return <ErrorIcon />;
    case NotificationSeverity.Info:
    default:
      return <InfoIcon />;
  }
};

const slideTransition = (props: any) => {
  return <Slide {...props} direction="left" />;
};

const getDefaultBgColor = (severity: NotificationSeverity) => {
  switch (severity) {
    case NotificationSeverity.Success:
      return "secondary.dark";
    case NotificationSeverity.Warning:
      return "primary.dark";
    case NotificationSeverity.Error:
      return "error";
    case NotificationSeverity.Info:
    default:
      return "secondary.light";
  }
};

export const NotificationManager = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  console.log("Notifications: ", notifications);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 26,
        right: 1,
        zIndex: 1500,
      }}
    >
      {notifications.map((notify, index) => (
        <Snackbar
          key={index}
          open={true}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          slots={{ transition: slideTransition }}
          sx={{
            // mt: 6,
            // top: `${24 + index * 90}px !important`,
            position: "relative",
            mt: index === 0 ? 0 : 2,
          }}
        >
          <Alert
            variant="filled"
            severity={notify.severity}
            icon={
              notify.icon ??
              getDefaultIcon(notify.severity ?? NotificationSeverity.Info)
            }
            action={
              notify.actions ?? (
                <IconButton
                  color="inherit"
                  onClick={() => removeNotification(notify.id)}
                >
                  <CloseIcon />
                </IconButton>
              )
            }
            sx={{
              minWidth: "290px",
              borderRadius: "8px",
              alignItems: "center",
              bgcolor: notify.severity && getDefaultBgColor(notify.severity),
            }}
          >
            <Typography fontWeight={600} variant="body1" fontSize={"large"}>
              {notify?.title}
            </Typography>
            {notify.message.includes(".") ? (
              <>
                {notify.message.split(".").map((part, idx) =>
                  part.trim() ? (
                    <Typography key={idx} fontWeight={600} variant="body1">
                      {part.trim()}
                    </Typography>
                  ) : null
                )}
              </>
            ) : (
              <Typography fontSize={"1.2rem"} variant="body1">
                {notify.message}
              </Typography>
            )}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};
