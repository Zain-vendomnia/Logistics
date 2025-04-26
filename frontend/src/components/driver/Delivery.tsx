import { useEffect, useState } from "react";
import { Box } from "@mui/material";

import ClientDetails from "../communications/Client_Details";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryFlowExecutor } from "../common/DeliveryFlowExecutor";
// import { DeliveryScenario } from "../common/delieryScenarios";

const Delivery = () => {
  const store = useDeliveryStore();

  const {
    deliveryId,
    deliveryState,
    actionsCompleted,
    scenarioKey,
    setScenario,
  } = useDeliveryStore();

  const [currentScenarioKey, setCurrentScenarioKey] = useState(scenarioKey);

  useEffect(() => {
    if (currentScenarioKey !== scenarioKey) {
      console.log("Scenario Updated to: ", scenarioKey);
      setCurrentScenarioKey(scenarioKey);
    }
  }, [scenarioKey]);

  // const evaluateScenarioFromStateAndActions = (
  //   deliveryState: DeliveryState,
  //   actions: DeliveryActionsCompleted,
  //   hasPermit: boolean
  // ): DeliveryScenario => {
  //   const {
  //     customerResponded,
  //     customerFoundAtLocation,
  //     driverReachedToLocation,
  //     neighborFound,
  //     neighborAccepts,
  //     noAcceptance,
  //   } = deliveryState;

  //   const hasCustomerSignature = actions.captureCustomerSignature === true;
  //   const hasCapturedDoorstep = actions.captureDoorstepImage === true;

  //   if (hasPermit) return DeliveryScenario.hasPermit;

  //   if (driverReachedToLocation) {
  //     if (customerFoundAtLocation && !hasCustomerSignature) {
  //       return DeliveryScenario.foundCustomer;
  //     }

  //     if (customerResponded && !hasCustomerSignature) {
  //       return DeliveryScenario.customerResponded;
  //     }

  //     if (
  //       !customerFoundAtLocation &&
  //       !customerResponded &&
  //       !hasCustomerSignature
  //     ) {
  //       if (!neighborFound && hasCapturedDoorstep) {
  //         return DeliveryScenario.findNeighborNearby;
  //       }
  //     }

  //     if (neighborFound && neighborAccepts) {
  //       return DeliveryScenario.neighborAccepts;
  //     }

  //     return DeliveryScenario.foundCustomer;
  //   }

  //   return DeliveryScenario.noAcceptance;
  // };

  // useEffect(() => {
  //   const { driverReachedToLocation } = deliveryState;

  //   if (driverReachedToLocation) {
  //     const evaluated = evaluateScenarioFromStateAndActions(
  //       deliveryState,
  //       actionsCompleted,
  //       store.tripData?.hasPermit ?? false
  //     );

  //     if (scenarioKey !== evaluated) {
  //       setScenario(deliveryId, evaluated);
  //     }
  //   }
  // }, [deliveryState, actionsCompleted, store.tripData]);

  console.log("Actions Completed ⌛: >Delivery< ", store.actionsCompleted);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"flex-start"}
      gap={5}
      height={"100%"}
      width={"100%"}
      pt={1}
    >
      <ClientDetails />

      <DeliveryFlowExecutor scenarioKey={currentScenarioKey} />
    </Box>
  );
};

export default Delivery;
