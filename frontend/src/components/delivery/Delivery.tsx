import { useEffect, useState, useCallback } from "react";
import { Box, Stack } from "@mui/material";

import ClientDetails from "../communications/Client_Details";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryFlowExecutor } from "./DeliveryFlowExecutor";
import { DeliveryScenario } from "./delieryScenarios";
import FoundCustomer from "./Found_Customer";
import CustomerResponded from "./Customer_Responded";

const Delivery = () => {
  const { scenarioKey, actionsCompleted } = useDeliveryStore();

  const [response, setResponse] = useState(false);

  const [isCustomerResponded, setIsCustomerResponded] = useState<
    boolean | null
  >(null);

  const [currentScenarioKey, setCurrentScenarioKey] =
    useState<DeliveryScenario | null>(scenarioKey ?? null);

  useEffect(() => {
    console.log("Current Delivery Scenario : ", scenarioKey);
    if (currentScenarioKey !== scenarioKey) {
      console.log("Scenario Updated to: ", scenarioKey);
      setCurrentScenarioKey(scenarioKey);
    }
  }, [scenarioKey]);

  useEffect(() => {
    if (isCustomerResponded === false) {
      const timer = setTimeout(() => {
        setResponse(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isCustomerResponded]);

  const handleFoundCustomer = (result: any) => {
    setIsCustomerResponded(result);
  };

  return (
    <>
      {isCustomerResponded === null && (
        <FoundCustomer onComplete={handleFoundCustomer} />
      )}
      {response && isCustomerResponded === false && (
        <CustomerResponded onComplete={handleFoundCustomer} />
      )}

      <Stack
        spacing={6}
        height={"100%"}
        width={"100%"}
        p={{ md: 1, lg: 2, xl: 3 }}
      >
        <ClientDetails />

        <Box height={"100%"}>
          {currentScenarioKey && (
            <DeliveryFlowExecutor
              scenarioKey={currentScenarioKey}
              completeButtonActivated={() => setIsCustomerResponded(true)}
            />
          )}
        </Box>
      </Stack>
    </>
  );
};

export default Delivery;
