import { useEffect, useState } from "react";
import { Box, Button, Divider, IconButton, Stack } from "@mui/material";
import { grey } from "@mui/material/colors";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import ClientDetails from "../communications/Client_Details";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryFlowExecutor } from "./DeliveryFlowExecutor";
import { DeliveryScenario, deliveryScenarios } from "./delieryScenarios";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import ParkingPermitRequest from "./ParkingPermitRequest";

const Delivery = () => {
  const { showNotification } = useNotificationStore();

  const { tripData, scenarioKey, actionsCompleted, deliveryId, setScenario } =
    useDeliveryStore();

  const [showDeliveryButtons, setShowDeliveryButtons] = useState<boolean>(true);

  // const [response, setResponse] = useState(false);
  // const [isCustomerResponded, setIsCustomerResponded] = useState<
  //   boolean | null
  // >(null);

  const [currentScenarioKey, setCurrentScenarioKey] =
    useState<DeliveryScenario | null>(scenarioKey ?? null);

  useEffect(() => {
    if (tripData?.hasPermit || scenarioKey === "noAcceptance") {
      setShowDeliveryButtons(false);
      return;
    }

    setShowDeliveryButtons(true);
  }, [scenarioKey, tripData?.hasPermit]);

  useEffect(() => {
    console.log("Current Delivery Scenario : ", scenarioKey);
    if (currentScenarioKey !== scenarioKey) {
      console.log("Scenario Updated to: ", scenarioKey);
      setCurrentScenarioKey(scenarioKey);
    }
  }, [scenarioKey]);

  // useEffect(() => {
  //   if (isCustomerResponded === false) {
  //     const timer = setTimeout(() => {
  //       setResponse(true);
  //     }, 3000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [isCustomerResponded]);

  const deliveryComplete = () => {
    setShowDeliveryButtons(false);
  };

  const handleScenarioSwitch = (req: string) => {
    if (!actionsCompleted.captureDoorstepImage) {
      showNotification({
        message: `Upload Client's Doorstep Image before proceeding.`,
        severity: NotificationSeverity.Warning,
        duration: 3000,
      });
      return;
    }
    console.log("Switching scenario to:", req);
    switch (req) {
      case "neighborAccepts":
        return setScenario(deliveryId, DeliveryScenario.neighborAccepts);
      case "noAcceptance":
        return setScenario(deliveryId, DeliveryScenario.noAcceptance);
      case "foundCustomer":
        return setScenario(deliveryId, DeliveryScenario.foundCustomer);
      default:
        return null;
    }
  };

  return (
    <>
      {/* {isCustomerResponded === null && (
        <FoundCustomer onComplete={handleFoundCustomer} />
      )} */}
      {/* {response && isCustomerResponded === false && (
      )} */}
      {/* <CustomerResponded onComplete={handleFoundCustomer} /> */}

      <Stack spacing={2} height={"100%"} width={"100%"}>
        {scenarioKey === "noAcceptance" && (
          <Box display="flex" alignItems={"flex-start"}>
            <IconButton onClick={() => handleScenarioSwitch("foundCustomer")}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        )}

        {scenarioKey !== DeliveryScenario.noAcceptance &&
          scenarioKey !== DeliveryScenario.damagedParcel && (
            <Box>
              <ParkingPermitRequest />
            </Box>
          )}

        <ClientDetails />

        {showDeliveryButtons && (
          <Box display="flex" justifyContent="space-around" width="100%">
            {scenarioKey === DeliveryScenario.neighborAccepts && (
              <Button
                variant="contained"
                onClick={() =>
                  handleScenarioSwitch(
                    DeliveryScenario.foundCustomer.toString()
                  )
                }
                disabled={!actionsCompleted.captureDoorstepImage}
              >
                Customer Found
              </Button>
            )}
            {scenarioKey !== DeliveryScenario.neighborAccepts && (
              <Button
                variant="contained"
                onClick={() => {
                  handleScenarioSwitch(
                    DeliveryScenario.neighborAccepts.toString()
                  );
                }}
                disabled={!actionsCompleted.captureDoorstepImage}
              >
                Neighbor Accepts
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() =>
                handleScenarioSwitch(DeliveryScenario.noAcceptance.toString())
              }
              color={"error"}
              disabled={!actionsCompleted.captureDoorstepImage}
            >
              Cancel
            </Button>
          </Box>
        )}

        <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
          {currentScenarioKey && (
            <DeliveryFlowExecutor
              scenarioKey={currentScenarioKey}
              completeButtonActivated={deliveryComplete}
            />
          )}
        </Box>
      </Stack>
    </>
  );
};

export default Delivery;
