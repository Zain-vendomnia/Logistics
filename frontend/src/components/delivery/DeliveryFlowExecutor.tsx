import { Box, Button } from "@mui/material";
import { DeliveryStep, DeliveryScenario } from "./delieryScenarios";
import { DeliveryStepRenderer } from "./DeliveryStepRenderer";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { useScenarioExecutor } from "../../hooks/useScenarioExecutor";

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

  const externalSteps: DeliveryStep[] = [
    "findCustomer",
    "findNeighbor",
    "showContactPromptAlert",
    "showFindNeighborPromptAlert",
    "waitForResponse",
  ];

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
              currentIndex !== stepsToRender.length -1
              // currentIndex < stepsToRender.length - 1
                ? { pointerEvents: "none", opacity: "50%" }
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
