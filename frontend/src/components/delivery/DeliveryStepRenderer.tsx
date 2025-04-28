import SignatureUpload from "../common/Signature_Upload";
import ReturnToWarehouse from "./Return_To_Warehouse";
import MarkAsNotDelivered from "./Mark_As_Not_Delivered";
import CameraCapture from "../common/Camera_Capture";
import ContactPromptAlert from "../communications/Contact_Prompt_Alert";
import FindNeighbor from "./Find_Neighbor";

const getLabel = (step: string) => {
  switch (step) {
    case "captureDoorstepImage":
      return "Client's Doorstep Image";
    case "captureParcelImage":
      return "Capture Parcel Image";
    case "captureNeighborDoorstepImage":
      return "Neighbor's Doorstep Image";
    case "captureCustomerSignature":
      return "Customer's Signature";
    case "captureNeighborSignature":
      return "Neighbor's Signature";
    case "markAsNotDelivered":
      return "Mark As Not Delivered";
    case "returnToWarehouse":
      return "Return To Warehouse";

    default:
      return "";
  }
};

type Props = {
  step: string;
  onComplete: () => void;
};

export const DeliveryStepRenderer = ({ step, onComplete }: Props) => {
  const label = getLabel(step);

  switch (step) {
    case "captureDoorstepImage":
    case "captureParcelImage":
    case "captureNeighborDoorstepImage":
      return (
        <CameraCapture
          styleCard={false}
          title={label}
          buttonText={"Upload Image"}
          showCameraIcon={true}
          onComplete={onComplete}
        />
      );
    case "captureCustomerSignature":
    case "captureNeighborSignature":
      return <SignatureUpload label={label} onComplete={onComplete} />;
    // case "sendSms":
    // should be an API call, to send automated message to customer.
    // return <SendSMS onComplete={onComplete} />;
    // case "makeCall":
    // should be message (popup), to show customer's number.
    // return <CallCustomer onComplete={onComplete} />;
    case "showContactPromptAlert":
      return <ContactPromptAlert onClose={onComplete} />;
    case "findNeighbor":
      return <FindNeighbor onComplete={onComplete} />;
    case "markAsNotDelivered":
      return <MarkAsNotDelivered onMarked={onComplete} />;
    case "returnToWarehouse":
      return <ReturnToWarehouse onComplete={onComplete} />;
    // case "waitForResponse":
    //   return <WaitForResponseTimeout onComplete={onComplete} />;
    default:
      return null;
  }
};
