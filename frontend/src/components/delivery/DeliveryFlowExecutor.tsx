import React, { useState, useEffect } from "react";
import { Box, Button, Stack } from "@mui/material";
import {
  deliveryScenarios,
  DeliveryStep,
  DeliveryScenario,
  Step,
} from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { DeliveryState, useDeliveryStore } from "../../store/useDeliveryStore";
import { grey } from "@mui/material/colors";

const Style = {
  container: {
    minHeight: "320px",
    minWidth: "100%",
    border: "2px solid",
    borderColor: "primary.dark",
    borderRadius: 2,
  },
  completeButton: {
    position: "relative",
    padding: "6px 12px",
    borderRadius: 2,
    width: "20vw",
    minWidth: 180,
    maxWidth: 240,
    height: "9vh",
  },
};

interface Props {
  scenarioKey: DeliveryScenario;
}

export const DeliveryFlowExecutor = ({ scenarioKey }: Props) => {
  const {
    success,
    setSuccess,
    deliveryState,
    actionsCompleted,
    markStepCompleted,
    setDeliveryCompleted,
    addOrdersDeliveredSuccessfully,
    addOrdersReturnToWareHouse,
    ordersReturnToWareHouse,
    deliveryId,
  } = useDeliveryStore();

  const [stepsToRender, setStepsToRender] = useState<DeliveryStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [orderCompleteButton, setOrderCompleteButton] = useState(false);
  const [orderReturnButton, setOrderReturnButton] = useState(false);

  useEffect(() => {
    const scenarioSteps = deliveryScenarios[scenarioKey] || [];
    const resolvedSteps = resolveSteps(scenarioSteps, deliveryState, 0);

    setStepsToRender(resolvedSteps);
    setCurrentIndex(0);
  }, [scenarioKey, deliveryState]);

  useEffect(() => {
    if (!stepsToRender.length) return;

    console.log("Steps to Follow: ", stepsToRender);

    const currentStep = stepsToRender[currentIndex];

    if (actionsCompleted[currentStep] === true) {
      advanceToNextStep();
    }
  }, [actionsCompleted, stepsToRender, currentIndex]);

  const resolveSteps = (
    steps: Step[],
    deliveryState: Partial<DeliveryState>,
    startIndex: number
  ): DeliveryStep[] => {
    const actionSteps: DeliveryStep[] = [];

    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];

      if (typeof step === "string") {
        actionSteps.push(step);
      } else {
        const condition = step.condition as keyof DeliveryState;
        if (deliveryState[condition]) {
          actionSteps.push(...step.actions);
          break;
        }
      }
    }
    return actionSteps;
  };

  const advanceToNextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stepsToRender.length) {
      setCurrentIndex(nextIndex);
    } else {
      if (
        stepsToRender[currentIndex] === "returnToWarehouse" ||
        actionsCompleted.returnToWarehouse === true
      ) {
        setOrderReturnButton(true);
      } else {
        setOrderCompleteButton(true);
      }
    }
  };

  const handleStepComplete = () => {
    markStepCompleted(stepsToRender[currentIndex]);
    advanceToNextStep();
  };

  const externalSteps: DeliveryStep[] = [
    "findCustomer",
    "findNeighbor",
    "showContactPromptAlert",
    "showFindNeighborPromptAlert",
    "waitForResponse",
  ];

  const handleOrderDelivered = () => {
    addOrdersDeliveredSuccessfully(deliveryId);
    setDeliveryCompleted(true);
  };
  const handleOrderReturn = () => {
    addOrdersReturnToWareHouse(deliveryId);
    setDeliveryCompleted(true);
  };

  if (!stepsToRender.length) return null;
  return (
    <Box height="100%" display="flex" flexDirection={"column"}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          p: 2,
          ...(externalSteps.includes(stepsToRender[currentIndex])
            ? {}
            : Style.container),
        }}
      >
        {(currentIndex === stepsToRender.length - 1 ||
          !actionsCompleted[stepsToRender[currentIndex]]) && (
          <Box
            sx={
              actionsCompleted[stepsToRender[currentIndex]] === true
                ? { pointerEvents: "none", opacity: 0.6 }
                : { pointerEvents: "auto" }
            }
          >
            <DeliveryStepRenderer
              key={`${stepsToRender[currentIndex]}-${currentIndex}`}
              step={stepsToRender[currentIndex]}
              onComplete={handleStepComplete}
            />
          </Box>
        )}
      </Box>

      <Box mt={"auto"} display={"flex"} justifyContent={"center"}>
        {orderCompleteButton && (
          <Button
            variant="contained"
            sx={Style.completeButton}
            onClick={handleOrderDelivered}
          >
            Delivered
          </Button>
        )}
        {orderReturnButton && (
          <Button
            variant="contained"
            sx={Style.completeButton}
            onClick={handleOrderReturn}
          >
            Order Return
          </Button>
        )}
      </Box>
    </Box>
  );
};
