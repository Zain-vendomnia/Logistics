import { useState } from "react";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import { Box, Button, Paper, Portal, Stack, Typography } from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import { DeliveryScenario } from "./delieryScenarios";

interface Props {
  onComplete: (found: boolean) => void;
}
const FoundCustomer = ({ onComplete }: Props) => {
  const iconSize: number = 156;

  const {
    deliveryState,
    updateDeliveryState,
    setSuccess,
    setScenario,
    deliveryId,
  } = useDeliveryStore();

  const [isFound, setIsFound] = useState<boolean | null>(null);

  const handleFoundSuccess = () => {
    setIsFound(true);
    updateDeliveryState({ customerFoundAtLocation: true });
    // setSuccess(true);
    console.log("Customer Found ... ");
    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.foundCustomer);
      onComplete(true);
    }, 2000);
  };

  const handleFoundFail = () => {
    setIsFound(false);
    updateDeliveryState({ customerFoundAtLocation: false });
    // setSuccess(false);
    console.log("Customer Not Found ...");
    setTimeout(() => {
      setScenario(deliveryId, DeliveryScenario.customerNotFound);
      onComplete(false);
    }, 2000);
  };

  return (
    <Portal>
      <Box position="fixed" top={124} right={24} zIndex={1000}>
        <Paper elevation={6} sx={{ p: 3, borderRadius: 2, minWidth: 300 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Found Customer?
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

export default FoundCustomer;
