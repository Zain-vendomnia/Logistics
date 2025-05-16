import { useEffect, useState } from "react";
import {
  DeliveryScenario,
  deliveryScenarios,
  DeliveryStep,
  Step,
} from "../components/delivery/delieryScenarios";
import { DeliveryState, useDeliveryStore } from "../store/useDeliveryStore";

interface Props {
  scenarioKey: DeliveryScenario;
}
export const useScenarioExecutor = ({ scenarioKey }: Props) => {
  const store = useDeliveryStore();
  const { deliveryState, actionsCompleted, markStepCompleted } = store;

  const [orderCompleteButton, setOrderCompleteButton] = useState(false);

  const [stepsToRender, setStepsToRender] = useState<DeliveryStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const advanceToNextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stepsToRender.length) {
      setCurrentIndex(nextIndex);
    } else {
      setOrderCompleteButton(true);
    }
  };

  const handleStepComplete = () => {
    markStepCompleted(stepsToRender[currentIndex]);
    advanceToNextStep();
  };

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

  useEffect(() => {
    const scenarioSteps = deliveryScenarios[scenarioKey] || [];
    const resolvedSteps = resolveSteps(scenarioSteps, deliveryState, 0);

    setStepsToRender(resolvedSteps);
    setCurrentIndex(0);
    // setOrderCompleteButton(false);
  }, [scenarioKey, deliveryState]);

  useEffect(() => {
    if (!stepsToRender.length) return;

    console.log("Steps to Follow: ", stepsToRender);

    const currentStep = stepsToRender[currentIndex];

    if (actionsCompleted[currentStep] === true) {
      advanceToNextStep();
    }
  }, [actionsCompleted, stepsToRender, currentIndex]);

  const currentStep = stepsToRender[currentIndex] ?? null;

  return {
    orderCompleteButton,

    stepsToRender,
    currentIndex,
    currentStep,

    advanceToNextStep,
    handleStepComplete,
  };
};
