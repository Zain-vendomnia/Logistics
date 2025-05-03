import { useState } from "react";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import { Box, Button, Paper, Portal, Stack, Typography } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";

import { useSnackbar } from "../../providers/SnackbarProvider";
import { DeliveryScenario } from "./delieryScenarios";

interface Props {
  onComplete: () => void;
}
const FoundNeighbor = ({ onComplete }: Props) => {
  const { showSnackbar } = useSnackbar();
  const iconSize: number = 156;

  const { updateDeliveryState, setScenario, deliveryId } = useDeliveryStore();

  const [isFound, setIsFound] = useState<boolean | null>(null);

  const handleFoundSuccess = () => {
    setIsFound(true);
    updateDeliveryState({ neighborFound: true });
    console.log("Neighbor Found Clicked");
    showSnackbar(
      "Check if neighbor accepts to make the delivery possible",
      "success"
    );
    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.neighborAccepts);
    }, 2000);
  };

  const handleFoundFail = () => {
    setIsFound(false);
    updateDeliveryState({ neighborFound: false });
    console.log("Neighbor Found Clicked");
    showSnackbar("Mark order return", "info");

    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.noAcceptance);
    }, 2000);
  };
  return (
    <Portal>
      <Box position="fixed" top={124} right={24} zIndex={1000}>
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
