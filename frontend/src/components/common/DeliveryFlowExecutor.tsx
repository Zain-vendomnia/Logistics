import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import {
  deliveryScenarios,
  DeliveryStep,
  DeliveryScenario,
  Step,
} from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { DeliveryState, useDeliveryStore } from "../../store/useDeliveryStore";

interface Props {
  scenarioKey: DeliveryScenario;
}

export const DeliveryFlowExecutor = ({ scenarioKey }: Props) => {
  const {
    deliveryState,
    actionsCompleted,
    markStepCompleted,
    setDeliveryCompleted,
  } = useDeliveryStore();

  const [stepsToRender, setStepsToRender] = useState<DeliveryStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const scenarioSteps = deliveryScenarios[scenarioKey] || [];
    const resolvedSteps = resolveSteps(scenarioSteps, deliveryState, 0);

    setStepsToRender(resolvedSteps);
    setCurrentIndex(0);
  }, [scenarioKey, deliveryState]);

  useEffect(() => {
    if (!stepsToRender.length) return;

    const currentStep = stepsToRender[currentIndex];
    if (actionsCompleted[currentStep]) {
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
      setDeliveryCompleted(true);
    }
  };

  const handleStepComplete = () => {
    markStepCompleted(stepsToRender[currentIndex]);
    advanceToNextStep();
  };

  if (!stepsToRender.length) return null;

  return (
    <Box
      display="flex"
      justifyContent="center"
      p={2}
      borderRadius={2}
      border="2px solid"
      borderColor="primary.dark"
      height="50%"
      width="100%"
    >
      {!actionsCompleted[stepsToRender[currentIndex]] && (
        <DeliveryStepRenderer
          key={`${stepsToRender[currentIndex]}-${currentIndex}`}
          step={stepsToRender[currentIndex]}
          onComplete={handleStepComplete}
        />
      )}
    </Box>
  );
};
