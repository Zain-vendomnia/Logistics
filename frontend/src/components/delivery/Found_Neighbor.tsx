import { useState } from "react";

import { Box, Button, Paper, Portal, Stack, Typography } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";

import { DeliveryScenario } from "./delieryScenarios";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { AttentionBox } from "../base-ui/AttentionBox";

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

    // showNotification({
    //   message: "Check if neighbor accepts the delivery",
    //   severity: NotificationSeverity.Success,
    // });

    setTimeout(() => {
      updateDeliveryState({ neighborFound: true, neighborAccepts: true });

      setScenario(deliveryId, DeliveryScenario.neighborAccepts);
    }, 2000);
  };

  const handleFoundFail = () => {
    setIsFound(false);

    setTimeout(() => {
      updateDeliveryState({
        neighborFound: true,
        neighborAccepts: false,
        noAcceptance: true,
      });

      setScenario(deliveryId, DeliveryScenario.noAcceptance);
    }, 2000);
  };

  return (
    <Portal>
      <Box position="fixed" top={164} right={24} zIndex={1000} mt={8}>
        <AttentionBox active={isFound === null} padding={0}>
          <Paper elevation={6} sx={{ p: 3, borderRadius: 2, minWidth: 300 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Found a Neighbor?
            </Typography>

            <Box mb={2} textAlign="center">
              {isFound === null && (
                <SentimentVerySatisfiedIcon style={{ fontSize: iconSize }} />
              )}
              {isFound === false && (
                <SentimentVeryDissatisfiedIcon
                  color="error"
                  style={{ fontSize: iconSize }}
                />
              )}
              {isFound === true && (
                <ThumbUpAltIcon
                  color="success"
                  style={{ fontSize: iconSize }}
                />
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
              <Button
                variant="outlined"
                color="error"
                onClick={handleFoundFail}
              >
                No
              </Button>
            </Stack>
          </Paper>
        </AttentionBox>
      </Box>
    </Portal>
  );
};

export default FoundNeighbor;
