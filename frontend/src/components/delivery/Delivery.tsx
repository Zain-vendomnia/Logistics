import { useEffect, useState } from "react";
import { Box } from "@mui/material";

import ClientDetails from "../communications/Client_Details";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryFlowExecutor } from "./DeliveryFlowExecutor";
import { DeliveryScenario } from "./delieryScenarios";
import FoundCustomer from "./Found_Customer";
import CustomerResponded from "./Customer_Responded";

const Delivery = () => {
  const { scenarioKey, actionsCompleted } = useDeliveryStore();

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

  const handleFoundCustomer = (result: any) => {
    setIsCustomerResponded(result);
  };

  console.log("Actions Completed ⌛: >Delivery< ", actionsCompleted);

  return (
    <>
      {isCustomerResponded === null && (
        <FoundCustomer onComplete={handleFoundCustomer} />
      )}
      {isCustomerResponded === false && (
        <CustomerResponded onComplete={handleFoundCustomer} />
      )}

      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={3}
        height={"100%"}
        width={"100%"}
        pt={1}
      >
        <ClientDetails />

        <Box height={"100%"}>
          {currentScenarioKey && (
            <DeliveryFlowExecutor scenarioKey={currentScenarioKey} />
          )}
        </Box>
      </Box>
    </>
  );
};

export default Delivery;
