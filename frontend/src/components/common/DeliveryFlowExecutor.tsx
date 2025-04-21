import React, { useState, useEffect } from "react";
import {
  deliveryScenarios,
  DeliveryStep,
  DeliveryScenario,
  Step,
} from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { DeliveryState, useDeliveryStore } from "../../store/useDeliveryStore";
import { Box } from "@mui/material";

export const DeliveryFlowExecutor = () => {
  const store = useDeliveryStore();
  const currentScenarioKey = store.scenarioKey;
  const currentDeliveryState = store.deliveryState;
  const scenarioSteps = deliveryScenarios[currentScenarioKey];

  const setDeliveryCompleted = store.setDeliveryCompleted;
  const addDeliveredOrder = store.addOrdersDeliveredSuccessfully;

  const [currentIndex, setCurrentIndex] = useState(0);

  const [stepsToRender, setStepsToRender] = useState<DeliveryStep[]>([]);

  useEffect(() => {
    const steps = resolveSteps(
      scenarioSteps,
      currentDeliveryState,
      currentIndex
    );
    if (steps.length === 0) {
      advanceToNextValidStep();
    } else {
      console.log("Delivery Scenario: ", currentScenarioKey);
      console.log("Resolved Steps to Render: ", steps);
      setStepsToRender(steps);
      setCurrentIndex(0);
    }
  }, []);

  const resolveSteps = (
    steps: Step[],
    deliveryState: Partial<DeliveryState>,
    index: number
  ): DeliveryStep[] => {
    const actionSteps: DeliveryStep[] = [];

    while (index < steps.length) {
      const step = steps[index];

      if (typeof step === "string") {
        actionSteps.push(step);
        index++;
        continue;
        // return [step];
      }

      const conditionKey = step.condition as keyof DeliveryState;
      if (conditionKey in deliveryState && deliveryState[conditionKey]) {
        // return step.actions;
        actionSteps.push(...step.actions);
        break;
      }

      // No match? Try next step
      index++;
    }
    return actionSteps;
  };

  const advanceToNextValidStep = () => {
    // const nextIndex = currentIndex + 1;
    // if (nextIndex < scenarioSteps.length) {

    if (currentIndex < stepsToRender.length - 1) {
      console.info("Next Step: ", stepsToRender[currentIndex + 1]);
      // setCurrentIndex(nextIndex);

      setCurrentIndex((prev) => prev + 1);
    } else {
      setDeliveryCompleted(true);
      // addDeliveredOrder(store.deliveryId);
    }
  };

  const handleStepComplete = () => {
    console.info("Completed step:", stepsToRender[currentIndex]);
    advanceToNextValidStep();
  };

  if (stepsToRender.length === 0) return null;

  return (
    <Box
      display="flex"
      justifyContent="center"
      p={2}
      borderRadius={2}
      border="2px solid"
      borderColor="primary.dark"
      height="100%"
      width="100%"
    >
      <DeliveryStepRenderer
        key={`${stepsToRender[currentIndex]}-${currentIndex}`}
        step={stepsToRender[currentIndex]}
        onComplete={handleStepComplete}
      />
      {/* {stepsToRender.map((step, i) => (
        
      ))} */}
    </Box>
  );
};
