import React from "react";
import CheckBoxItem from "../common/CheckBoxItem";
import SignatureUpload from "../common/Signature_Upload";

interface Props {
  label: string;
  onComplete: () => void;
}
const ChallengeRenderer = ({ label: step, onComplete }: Props) => {
  switch (step) {
    case "Upload Customer Doorstep Image":
    case "Upload Neighbor Doorstep Image":
    case "Uplaod Order Delivered Image":
      return <CheckBoxItem title={step} onImageUpload={() => onComplete()} />;
    case "Uplaod Customer Signature":
    case "Uplaod Neighbor Signature":
      return <SignatureUpload label={step} onComplete={onComplete} />;
    default:
      return null;
  }
};

export default ChallengeRenderer;
