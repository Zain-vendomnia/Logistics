import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeliveryScenario,
  deliveryScenarios,
  DeliveryStep,
  Step,
} from "../components/delivery/delieryScenarios";
import {
  DeliveryActionsCompleted,
  DeliveryState,
  useDeliveryStore,
} from "../store/useDeliveryStore";

interface Props {
  scenarioKey: DeliveryScenario;
  actionsCompleted: DeliveryActionsCompleted;
  markStepCompleted: (step: DeliveryStep) => void;
}

export const useScenarioExecutor = ({
  scenarioKey,
  actionsCompleted,
  markStepCompleted,
}: Props) => {
  const store = useDeliveryStore();
  const { deliveryState } = store;

  const [orderCompleteButton, setOrderCompleteButton] = useState(false);

  const [stepsToRender, setStepsToRender] = useState<DeliveryStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStep = useMemo(() => {
    return stepsToRender.length > 0 && currentIndex < stepsToRender.length
      ? stepsToRender[currentIndex]
      : null;
  }, [stepsToRender, currentIndex]);

  const advanceToNextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < stepsToRender.length) {
      setCurrentIndex(nextIndex);
    } else {
      setOrderCompleteButton(true);
    }
  };

  const handleStepComplete = useCallback(() => {
    if (currentStep) {
      markStepCompleted(currentStep);
      advanceToNextStep();
    }
  }, [currentStep, markStepCompleted]);

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

  // specify steps to render
  useEffect(() => {
    const scenarioSteps = deliveryScenarios[scenarioKey] || [];
    const resolvedSteps = resolveSteps(scenarioSteps, deliveryState, 0);

    setStepsToRender(resolvedSteps);
    setCurrentIndex(0);
    setOrderCompleteButton(false);
  }, [scenarioKey, deliveryState]);

  useEffect(() => {
    if (!stepsToRender.length || !currentStep) return;

    console.log("Steps to Follow: ", stepsToRender);

    if (actionsCompleted[currentStep] === true) {
      advanceToNextStep();
    }
  }, [actionsCompleted, stepsToRender, currentIndex]);

  return {
    orderCompleteButton,

    stepsToRender,
    currentIndex,
    currentStep,

    advanceToNextStep,
    handleStepComplete,
  };
};
