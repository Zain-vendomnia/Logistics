import { Box, Button } from "@mui/material";
import { DeliveryStep, DeliveryScenario } from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { useScenarioExecutor } from "../../hooks/useScenarioExecutor";
import { useEffect } from "react";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";

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

const externalSteps: DeliveryStep[] = [
  "findCustomer",
  "findNeighbor",
  "showContactPromptAlert",
  "showFindNeighborPromptAlert",
  "showFindNeighborNotification",
  "getNeighborDetails",
  "waitForResponse",
  "getRating",
  "notifyForOrderReturn",
];

interface Props {
  scenarioKey: DeliveryScenario;
  completeButtonActivated: (active: boolean) => void;
}

export const DeliveryFlowExecutor = ({
  scenarioKey,
  completeButtonActivated,
}: Props) => {
  const store = useDeliveryStore();
  const { actionsCompleted, markStepCompleted } = store;

  const { handleOrderComplete, handleOrderReturn } = useTripLifecycle();

  const {
    orderCompleteButton,
    stepsToRender,
    currentIndex,
    currentStep,
    handleStepComplete,
  } = useScenarioExecutor({ scenarioKey, actionsCompleted, markStepCompleted });

  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (orderCompleteButton === true) {
      completeButtonActivated(true);
    }
  }, [orderCompleteButton]);

  const getContainerStyle = (currentStep: DeliveryStep | null) => {
    if (!currentStep || externalSteps.includes(currentStep)) return {};
    return Style.container;
  };

  const isCompleteButtonDisabled =
    orderCompleteButton && currentIndex !== stepsToRender.length - 1;

  if (!stepsToRender.length) return null;
  return (
    <Box height="100%" display="flex" flexDirection={"column"}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          p: 2,
          ...getContainerStyle(currentStep),
        }}
      >
        {(currentIndex === stepsToRender.length - 1 ||
          (currentStep && !actionsCompleted[currentStep])) && (
          <Box
            sx={
              currentStep && actionsCompleted[currentStep] === true
                ? { pointerEvents: "none", opacity: 0.6 }
                : { pointerEvents: "auto" }
            }
          >
            {currentStep && (
              <DeliveryStepRenderer
                key={`${currentStep}-${currentIndex}`}
                step={currentStep}
                onComplete={handleStepComplete}
              />
            )}
          </Box>
        )}
      </Box>

      <Box mt={"auto"} display={"flex"} justifyContent={"center"}>
        {orderCompleteButton && (
          <Button
            variant="contained"
            sx={{
              ...Style.completeButton,
              ...(isCompleteButtonDisabled && {
                pointerEvents: "none",
                opacity: "50%",
              }),
            }}
            onClick={
              currentStep === "returnToWarehouse" &&
              actionsCompleted.returnToWarehouse === true
                ? handleOrderReturn
                : handleOrderComplete
            }
          >
            Order {currentStep === "returnToWarehouse" ? "Return" : "Delivered"}
          </Button>
        )}
      </Box>
    </Box>
  );
};
