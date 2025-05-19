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
import { useDelayStep } from "../../hooks/useDelayStep";

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
  "waitForResponse",
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
  const { actionsCompleted } = store;

  const { handleOrderComplete, handleOrderReturn } = useTripLifecycle();

  const {
    orderCompleteButton,
    stepsToRender,
    currentIndex,
    currentStep,
    handleStepComplete,
  } = useScenarioExecutor({ scenarioKey });

  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (currentStep === "showFindNeighborNotification") {
      const timer = setTimeout(() => {
        showNotification({
          message: "Find Neighbors around who can accept deliery for customer.",
          severity: NotificationSeverity.Success,
        });
        setTimeout(() => {
          handleStepComplete();
        }, 9000);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (orderCompleteButton === true) {
      completeButtonActivated(true);
    }
  }, [orderCompleteButton]);

  if (!stepsToRender.length) return null;
  return (
    <Box height="100%" display="flex" flexDirection={"column"}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          p: 2,
          ...(externalSteps.includes(currentStep) ? {} : Style.container),
        }}
      >
        {(currentIndex === stepsToRender.length - 1 ||
          !actionsCompleted[currentStep]) && (
          <Box
            sx={
              actionsCompleted[currentStep] === true
                ? { pointerEvents: "none", opacity: 0.6 }
                : { pointerEvents: "auto" }
            }
          >
            <DeliveryStepRenderer
              key={`${currentStep}-${currentIndex}`}
              step={currentStep}
              onComplete={handleStepComplete}
            />
          </Box>
        )}
      </Box>

      <Box mt={"auto"} display={"flex"} justifyContent={"center"}>
        {orderCompleteButton && (
          <Button
            variant="contained"
            sx={{
              ...Style.completeButton,
              ...(orderCompleteButton &&
              currentIndex !== stepsToRender.length - 1
                ? // currentIndex < stepsToRender.length - 1
                  { pointerEvents: "none", opacity: "50%" }
                : { pointerEvents: "auto" }),
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
