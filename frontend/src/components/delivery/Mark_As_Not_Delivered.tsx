import React from "react";
import { Button } from "@mui/material";

interface Props {
  onMarked?: () => void;
}

const MarkAsNotDelivered = ({ onMarked }: Props) => {

  const handleMark = () => {
    console.log("Order marked as not delivered");
    onMarked?.();
  };

  return <Button onClick={handleMark}>Mark as Not Delivered</Button>;
};

export default MarkAsNotDelivered;
