import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useDeliveryStore } from "../../store/useDeliveryStore";

const DeliveryReturnReasons = [
  "Customer not found",
  "Neighbors did not accept",
  "Customer requested delivery rechedule",
];

interface Props {
  onComplete?: () => void;
}

const ReturnToWarehouse = ({ onComplete }: Props) => {
  const { addOrdersReturnToWareHouse, deliveryId } = useDeliveryStore();

  const [returnReason, setReturnReason] = useState("");

  const handleReturn = () => {
    console.log("Returning to warehouse");
    addOrdersReturnToWareHouse(deliveryId);
    onComplete?.();
  };

  return (
    <Box display={"flex"} flexDirection={"column"} gap={2} height="100%">
      <Paper elevation={1} sx={{ p: 3, height: "100%" }}>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={"bold"}>
            Return Reason:
          </Typography>
          <Typography variant="body1" fontSize={"1.25rem"}>
            {returnReason}
          </Typography>
        </Stack>
      </Paper>
      <Box mt="auto">
        <Button
          variant="contained"
          onClick={handleReturn}
          sx={{
            position: "relative",
            padding: "6px 12px",
            borderRadius: 2,
            width: "20vw",
            minWidth: 180,
            maxWidth: 240,
            height: "9vh",
          }}
        >
          Mark Order Return
        </Button>
      </Box>
    </Box>
  );
};

export default ReturnToWarehouse;
