import React from "react";
import { Button } from "@mui/material";
import { useDeliveryStore } from "../../store/useDeliveryStore";

interface Props {
  onComplete?: () => void;
}

const ReturnToWarehouse = ({ onComplete }: Props) => {
  const store = useDeliveryStore();
  //   const returnOrder = useDeliveryStore((s) => s.returnOrder);
  const returnOrder = store.addOrdersReturnToWareHouse;

  const handleReturn = () => {
    console.log("Returning to warehouse");
    returnOrder();
    onComplete?.();
  };

  return <Button onClick={handleReturn}>Return to Warehouse</Button>;
};

export default ReturnToWarehouse;
