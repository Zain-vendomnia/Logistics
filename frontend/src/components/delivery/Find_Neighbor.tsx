import { useEffect, useState } from "react";

import { DeliveryState, useDeliveryStore } from "../../store/useDeliveryStore";
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  ToggleButton,
  Typography,
} from "@mui/material";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";

interface Props {
  onComplete: () => void;
}
const FindNeighbor = ({ onComplete }: Props) => {
  const iconSize: number = 156;

  const { deliveryState, updateDeliveryState, setSuccess } = useDeliveryStore();

  const [neighborFound, setNeighborFound] = useState<boolean | null>(null);

  const neighborFoundSuccess = () => {
    setNeighborFound(true);
    updateDeliveryState({ neighborFound: true });
    setSuccess(true);
    console.log("Neighbor Found Clicked");
    // onComplete();
  };

  const neighborFoundFail = () => {
    setNeighborFound(false);
    updateDeliveryState({ neighborFound: false });
    setSuccess(false);
    console.log("Neighbor Found Clicked");
    // onComplete();
  };
  return (
    <Stack spacing={4} display="flex">
      <Stack spacing={1} width={"100%"}>
        <Typography variant="h5" fontWeight="bold">
          Found a Neighbor?
        </Typography>
        {/* <Typography variant="body1">{description}</Typography> */}
      </Stack>

      <Stack
        spacing={3}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Box>
          {neighborFound === null ? (
            <SentimentDissatisfiedIcon style={{ fontSize: iconSize }} />
          ) : !neighborFound ? (
            <SentimentVeryDissatisfiedIcon
              style={{ fontSize: iconSize }} // color: "#fff"
            />
          ) : (
            <SentimentVerySatisfiedIcon style={{ fontSize: iconSize }} />
          )}
        </Box>

        <Box display={"flex"} justifyContent={"center"} gap={1}>
          <Button
            variant="contained"
            color={"success"}
            onClick={neighborFoundSuccess}
          >
            Yes
          </Button>
          <Button
            variant="outlined"
            color={"error"}
            onClick={neighborFoundFail}
          >
            No
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
};

export default FindNeighbor;
