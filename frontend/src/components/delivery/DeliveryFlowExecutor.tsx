import { Box, Button } from "@mui/material";
import { DeliveryStep, DeliveryScenario } from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { useScenarioExecutor } from "../../hooks/useScenarioExecutor";
import { useEffect } from "react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { DeliveryReturnReasons } from "./Return_To_Warehouse";

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
  "scanQR",
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
  const { deliveryState, actionsCompleted, markStepCompleted } = store;

  const { handleOrderComplete, handleOrderReturn } = useTripLifecycle();

  const {
    orderCompleteButton,
    stepsToRender,
    currentIndex,
    currentStep,
    handleStepComplete,
  } = useScenarioExecutor({ scenarioKey, actionsCompleted, markStepCompleted });

  useEffect(() => {
    if (orderCompleteButton === true) {
      completeButtonActivated(true);
    }
  }, [orderCompleteButton]);

  const getContainerStyle = (currentStep: DeliveryStep | null) => {
    if (!currentStep || externalSteps.includes(currentStep)) return {};
    return Style.container;
  };

  const handleOrderDeliveryButton = () => {
    if (
      (currentStep === "returnToWarehouse" &&
        actionsCompleted.returnToWarehouse === true) ||
      scenarioKey === DeliveryScenario.damagedParcel
    ) {
      handleOrderReturn();
    } else {
      handleOrderComplete();
    }
  };

  const getButtonText = (state: string | null) => {
    switch (state) {
      case DeliveryReturnReasons.customerNotFound:
      case DeliveryReturnReasons.neighboursNotFound:
      case DeliveryReturnReasons.neighborNotAccepts:
      case DeliveryReturnReasons.deliveryReschedule:
      case DeliveryReturnReasons.damagedParcel:
        return "Complete";

      case DeliveryReturnReasons.orderReturn:
        return "Cancelled";

      default:
        return "Delivered";
    }
  };

  const isCompleteButtonDisabled =
    orderCompleteButton && currentIndex !== stepsToRender.length - 1;

  if (!stepsToRender.length) return null;
  return (
    <Box display="flex" height={"100%"} flexDirection={"column"}>
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

      {orderCompleteButton && (
        <Box mt={"auto"} display={"flex"} justifyContent={"center"}>
          <Button
            variant="contained"
            sx={{
              ...Style.completeButton,
              ...(isCompleteButtonDisabled && {
                pointerEvents: "none",
                opacity: "50%",
              }),
            }}
            onClick={handleOrderDeliveryButton}
          >
            Order {getButtonText(deliveryState.deliveryReturnReason)}
            {/* Order {getButtonText(currentStep)} */}
          </Button>
        </Box>
      )}
    </Box>
  );
};
