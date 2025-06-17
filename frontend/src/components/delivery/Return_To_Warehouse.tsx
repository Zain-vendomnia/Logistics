import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
  List,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { DeliveryScenario } from "./delieryScenarios";

export enum DeliveryReturnReasons {
  customerNotFound = "Customer not found",
  neighboursNotFound = "Neighbors not found",
  neighborNotAccepts = "Neighbor not accepts",
  deliveryReschedule = "Delivery reschedule",
  damagedParcel = "Damaged Parcel",
  orderReturn = "Order Return",
}
const deliveryReturnReasons = Object.values(DeliveryReturnReasons);

interface Props {
  onComplete?: () => void;
}

const ReturnToWarehouse = ({ onComplete }: Props) => {
  const { updateDeliveryState, deliveryState, deliveryId, setScenario } =
    useDeliveryStore();

  const [returnReason, setReturnReason] = useState<string>("");
  const [reasonSubmitted, setReasonSubmitted] = useState<boolean>(true);

  useEffect(() => {
    console.log("Delivery return Reason: ", returnReason);
  }, [returnReason]);

  // fetching data from store
  useEffect(() => {
    if (deliveryState.deliveryReturnReason) {
      setReturnReason(deliveryState.deliveryReturnReason);
    }
  }, [deliveryState.deliveryReturnReason]);

  const handleOrderReturn = () => {
    if (!returnReason) {
      useNotificationStore.getState().showNotification({
        message: "Select a return reason.",
        severity: NotificationSeverity.Error,
      });
      return;
    }
    updateDeliveryState({ deliveryReturnReason: returnReason });
    if (returnReason.includes("Damaged Parcel")) {
      setScenario(deliveryId, DeliveryScenario.damagedParcel);
    } else {
      setReasonSubmitted(true);
      onComplete?.();
    }
  };

  const handleReasonSelection = (value: string) => {
    setReturnReason(value);
    setReasonSubmitted(false);
    // if (!returnReason) {
    //   setReturnReason(value);
    // } else {
    //   let reasons = returnReason.split(",");
    //   if (reasons.includes(value)) {
    //     reasons = reasons.filter((reason) => reason !== value);
    //     setReturnReason(reasons.join(","));
    //   } else {
    //     setReturnReason((prev) => (prev ? `${prev},${value}` : value));
    //   }
    // }
  };

  return (
    <Box width={"100%"}>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="h6" fontWeight={"bold"}>
          Select Reason:
        </Typography>
        <Divider color={grey[100]} />

        <List>
          {deliveryReturnReasons.map((value, index) => {
            return (
              <Box
                key={index}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"flex-start"}
                mt={0.5}
                gap={1}
                width="100%"
              >
                <FormGroup sx={{ p: 0, width: "100%" }}>
                  <FormControlLabel
                    value={value}
                    control={
                      <Radio
                        checked={returnReason.split(",").includes(value)}
                        onChange={() => handleReasonSelection(value)}
                        sx={{ p: 0, pt: 0.3, pr: 0.5 }}
                      />
                    }
                    label={value}
                    sx={{
                      width: "100%",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      p: 0,
                      m: 0,
                      // fontSize: "1.2rem",
                    }}
                  />
                </FormGroup>

                {/* <Box>
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
                    </Box> */}
              </Box>
            );
          })}
        </List>
        <Box display="flex" justifyContent={"center"}>
          <Button
            hidden={reasonSubmitted}
            fullWidth
            variant="contained"
            onClick={handleOrderReturn}
            sx={{
              padding: "6px 12px",
              borderRadius: 2,
              minWidth: 180,
              maxWidth: 240,
              height: "70px",
              // height: "9vh",
            }}
          >
            Confirm
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ReturnToWarehouse;
