import { useState } from "react";
import { DeliveryFlowExecutor } from "../common/DeliveryFlowExecutor";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { Box, Typography } from "@mui/material";
import { DeliveryScenario } from "../common/delieryScenarios";

const Delivery = () => {
  const store = useDeliveryStore();
  console.log("Order Id in progess-:-> ", store.deliveryId);
  console.log("Optimal Delivery Scenario-:-> ", store.scenarioKey);

  const { deliveryState } = useDeliveryStore();
  const scenarioKey = useDeliveryStore((s) => s.scenarioKey);
  return (
    <Box
      height={"50%"}
      display={"flex"}
      gap={2}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"flex-start"}
    >
      <Typography>Delivery...</Typography>
      <DeliveryFlowExecutor
        scenarioKey={scenarioKey ?? DeliveryScenario.foundCustomer}
        // deliveryState={deliveryState}
      />
    </Box>
  );
};

export default Delivery;
