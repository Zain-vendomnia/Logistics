import { useState } from "react";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import { Box, Button, Paper, Portal, Stack, Typography } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";

// import { useSnackbar } from "../../providers/SnackbarProvider";
import { DeliveryScenario } from "./delieryScenarios";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";

interface Props {
  onComplete: () => void;
}
const FoundNeighbor = ({ onComplete }: Props) => {
  const { showNotification } = useNotificationStore();
  const iconSize: number = 156;

  const { updateDeliveryState, setScenario, deliveryId } = useDeliveryStore();

  const [isFound, setIsFound] = useState<boolean | null>(null);

  const handleFoundSuccess = () => {
    setIsFound(true);
    updateDeliveryState({ neighborFound: true, neighborAccepts: true });
    console.log("Neighbor Found Clicked");
    showNotification({
      message: "Check if neighbor accepts the delivery",
      severity: NotificationSeverity.Success,
    });
    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.neighborAccepts);
    }, 2000);
  };

  const handleFoundFail = () => {
    setIsFound(false);
    updateDeliveryState({
      neighborFound: true,
      neighborAccepts: false,
      noAcceptance: true,
    });
    console.log("Neighbor Found Clicked");
    showNotification({
      message: "Mark order return",
      severity: NotificationSeverity.Info,
    });

    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.noAcceptance);
    }, 2000);
  };
  return (
    <Portal>
      <Box position="fixed" top={124} right={24} zIndex={1000} mt={8}>
        <Paper elevation={6} sx={{ p: 3, borderRadius: 2, minWidth: 300 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Found a Neighbor?
          </Typography>

          <Box mb={2} textAlign="center">
            {isFound === null ? (
              <SentimentVerySatisfiedIcon style={{ fontSize: iconSize }} />
            ) : !isFound ? (
              <SentimentVeryDissatisfiedIcon
                color="error"
                style={{ fontSize: iconSize }}
              />
            ) : (
              <ThumbUpAltIcon color="success" style={{ fontSize: iconSize }} />
            )}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="success"
              onClick={handleFoundSuccess}
            >
              Yes
            </Button>
            <Button variant="outlined" color="error" onClick={handleFoundFail}>
              No
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Portal>
  );
};

export default FoundNeighbor;
