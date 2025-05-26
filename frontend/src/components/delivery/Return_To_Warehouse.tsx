import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Divider,
  List,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { ModalWrapper } from "../common/ModalWrapper";
import Camera from "../common/Camera";
import { ImageType } from "../../hooks/useCameraCapture";

const DeliveryReturnReasons = [
  "Customer not found",
  "Neighbors did not accept",
  "Customer requested delivery rechedule",

  "Damaged parts",
  "Order cancelled",
];

interface Props {
  onComplete?: () => void;
}

const ReturnToWarehouse = ({ onComplete }: Props) => {
  const { updateDeliveryState, deliveryState } = useDeliveryStore();

  const [returnReason, setReturnReason] = useState<string>("");
  const [isDamagedPartSelected, setIsDamagedPartSelected] = useState(false);
  const [damagedPartsImageUploaded, setDamagedPartsImageUploaded] =
    useState(false);

  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (damagedPartsImageUploaded) {
      setIsDamagedPartSelected(false);

      showNotification({
        message: "Image Uplaoded",
        severity: NotificationSeverity.Info,
      });
    }
  }, [damagedPartsImageUploaded]);

  useEffect(() => {
    if (returnReason.includes("Damaged parts") && !damagedPartsImageUploaded) {
      setIsDamagedPartSelected(true);
    }
  }, [returnReason, damagedPartsImageUploaded]);

  useEffect(() => {
    if (deliveryState.deliveryReturnReason) {
      setReturnReason(deliveryState.deliveryReturnReason);
    }
  }, [deliveryState.deliveryReturnReason]);

  const handleReasonSelection = (value: string) => {
    if (!returnReason) {
      setReturnReason(value);
    } else {
      let reasons = returnReason.split(",");
      if (reasons.includes(value)) {
        reasons = reasons.filter((reason) => reason !== value);
        setReturnReason(reasons.join(","));
      } else {
        setReturnReason((prev) => (prev ? `${prev},${value}` : value));
      }
    }
  };

  const handleOrderReturn = () => {
    const isDamaged = returnReason.includes("Damaged parts");
    const isCancelled = returnReason.includes("Order cancelled");

    if (isDamaged && !damagedPartsImageUploaded) {
      setIsDamagedPartSelected(true);
    }

    if (isCancelled) {
      showNotification({
        message: "Cancellation email sent to customer.",
        severity: NotificationSeverity.Info,
      });
    }

    updateDeliveryState({ deliveryReturnReason: returnReason });

    const shouldComplete =
      !isDamaged || (isDamaged && damagedPartsImageUploaded);

    if (shouldComplete) {
      onComplete?.();
    }
  };

  const uploadDamagedPartImage = (
    <ModalWrapper
      open={isDamagedPartSelected}
      title={"Upload Damaged Part Image"}
      onClose={() => setIsDamagedPartSelected((prev) => !prev)}
      size="md"
    >
      <Box>
        <Camera
          type={ImageType.ParcelImage_Damaged}
          buttonText={"Image"}
          isComplied={false}
          onImageUploaded={(value) => setDamagedPartsImageUploaded(value)}
        />
      </Box>
    </ModalWrapper>
  );

  return (
    <>
      {isDamagedPartSelected &&
        !damagedPartsImageUploaded &&
        uploadDamagedPartImage}

      <Box display={"flex"} flexDirection={"column"} gap={2} height="100%">
        <Paper elevation={1} sx={{ py: 2, px: 2, height: "100%" }}>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={"bold"}>
              Select Reason:
            </Typography>
            <Divider color={grey[100]} />

            <List>
              {DeliveryReturnReasons.map((value, index) => {
                return (
                  <Box
                    key={index}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"flex-start"}
                    gap={1}
                    width="100%"
                  >
                    <Checkbox
                      edge="start"
                      onChange={() => handleReasonSelection(value)}
                      checked={returnReason.split(",").includes(value)}
                      sx={{
                        p: 0.5,
                        alignSelf: "start",
                      }}
                    />
                    <Typography
                      variant={"body1"}
                      fontSize={"1.2rem"}
                      lineHeight={1.5}
                    >
                      {value}
                    </Typography>
                  </Box>
                );
              })}
            </List>
          </Stack>
        </Paper>
        <Box display="flex" justifyContent={"center"} mt="auto">
          <Button
            disabled={!returnReason}
            fullWidth
            variant="contained"
            onClick={handleOrderReturn}
            sx={{
              padding: "6px 12px",
              borderRadius: 2,
              minWidth: 180,
              maxWidth: 240,
              height: "9vh",
            }}
          >
            Mark Order Return
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ReturnToWarehouse;
