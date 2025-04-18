import React, { useState } from "react";
import {
  deliveryScenarios,
  DeliveryStep,
  DeliveryScenario,
} from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { DeliveryState, useDeliveryStore } from "../../store/useDeliveryStore";
import { Box } from "@mui/material";

type Props = {
  scenarioKey: DeliveryScenario;
  deliveryState?: Partial<DeliveryState>;
  // deliveryState: {
  //   customerResponded?: boolean;
  //   neighborAccepts?: boolean;
  //   [key: string]: boolean | undefined;
  // };
};

export const DeliveryFlowExecutor = ({ scenarioKey, deliveryState }: Props) => {
  const store = useDeliveryStore();
  const currentScenarioKey = scenarioKey ?? store.scenarioKey;
  const currentDeliveryState = deliveryState ?? store.deliveryState;

  const scenarioSteps = deliveryScenarios[currentScenarioKey];
  const [currentIndex, setCurrentIndex] = useState(0);

  const setDeliveryCompleted = useDeliveryStore((s) => s.setDeliveryCompleted);
  const addDeliveredOrder = useDeliveryStore(
    (s) => s.addOrdersDeliveredSuccessfully
  );

  const handleNext = () => {
    console.info("Step Completed: ", scenarioSteps[currentIndex]);

    if (currentIndex < scenarioSteps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      console.info("Next Step: ", scenarioSteps[currentIndex + 1]);
    } else {
      setDeliveryCompleted(true);
      addDeliveredOrder(store.deliveryId);
      console.log("Orders Completed:: ", store.ordersDeliveredSuccessfully);
    }
  };

  const getCurrentSteps = (): DeliveryStep[] => {
    const step = scenarioSteps[currentIndex];

    if (typeof step === "string") return [step];
    if (
      typeof step === "object" &&
      step.condition in currentDeliveryState &&
      currentDeliveryState[step.condition as keyof DeliveryState]
    )
      return step.actions;
    return []; // Skip step if condition not met
  };

  const stepsToRender = getCurrentSteps();

  if (stepsToRender.length === 0) {
    // handleNext();
    return null;
  }

  return (
    <>
      <Box
        display={"flex"}
        justifyContent={"center"}
        p={2}
        borderRadius={2}
        border={"2px solid"}
        borderColor={"primary.dark"}
        height={"100%"}
        width={"100%"}
      >
        {stepsToRender.map((step, i) => (
          <DeliveryStepRenderer
            key={`${step}-${i}`}
            step={step}
            onComplete={handleNext}
          />
        ))}
      </Box>
    </>
  );
};
