import { useEffect, useState } from "react";
import { Box } from "@mui/material";

import ClientDetails from "../communications/Client_Details";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryFlowExecutor } from "./DeliveryFlowExecutor";
import { DeliveryScenario } from "./delieryScenarios";
import FoundCustomer from "./Found_Customer";

const Delivery = () => {
  const { scenarioKey, actionsCompleted } = useDeliveryStore();

  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [currentScenarioKey, setCurrentScenarioKey] =
    useState<DeliveryScenario | null>(scenarioKey ?? null);

  useEffect(() => {
    console.log("Current Delivery Scenario : ", scenarioKey);
    if (currentScenarioKey !== scenarioKey) {
      console.log("Scenario Updated to: ", scenarioKey);
      setCurrentScenarioKey(scenarioKey);
    }
  }, [scenarioKey]);

  const handleFoundCustomer = (result: any) => {
    setCustomerFound(result);
  };

  console.log("Actions Completed ⌛: >Delivery< ", actionsCompleted);

  return (
    <>
      {customerFound === null && (
        <FoundCustomer onComplete={handleFoundCustomer} />
      )}

      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        justifyContent={"flex-start"}
        gap={5}
        height={"100%"}
        width={"100%"}
        pt={1}
      >
        <ClientDetails />

        {currentScenarioKey && (
          <DeliveryFlowExecutor scenarioKey={currentScenarioKey} />
        )}
      </Box>
    </>
  );
};

export default Delivery;
