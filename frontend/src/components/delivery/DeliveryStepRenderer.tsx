import SignatureUpload from "../common/Signature_Upload";
import ReturnToWarehouse from "./Return_To_Warehouse";
import MarkAsNotDelivered from "./Mark_As_Not_Delivered";
import CameraCapture from "../common/Camera_Capture";
import ContactPromptAlert from "../communications/Contact_Prompt_Alert";
import FoundNeighbor from "./Found_Neighbor";
import NeighborDetailsForm from "./NeighborDetailsForm";
import { ImageType } from "../../hooks/useCameraCapture";
import { ModalWrapper } from "../common/ModalWrapper";
import StarRating from "../common/Star_Rating";
import Notification from "../Notification";
import { NotificationSeverity } from "../../store/useNotificationStore";

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
    case "showContactPromptAlert":
      return "Contact Customer, Try contact to customer via SMS and Call. Find Neighbors nearby who can accept on customer's behalf.";
    case "showFindNeighborPromptAlert":
      return "Contact Neighbor,Reach out to the Neighbors.";
    case "markAsNotDelivered":
      return "Mark As Not Delivered";
    case "returnToWarehouse":
      return "Return To Warehouse";
    case "damagedParcelImage":
      return "Upload Damaged Parcel";
    default:
      return "";
  }
};
const getImageType = (step: string) => {
  switch (step) {
    case "captureDoorstepImage":
      return ImageType.Customer_Doorstep;
    case "captureParcelImage":
      return ImageType.ParcelImage;
    case "captureNeighborDoorstepImage":
      return ImageType.Neighbor_Doorstep;
    case "damagedParcelImage":
      return ImageType.ParcelImage_Damaged;
    default:
      return ImageType.Customer_Doorstep;
  }
};

type Props = {
  step: string;
  onComplete: () => void;
};

export const DeliveryStepRenderer = ({ step, onComplete }: Props) => {
  const label = getLabel(step);
  const imageType = getImageType(step);

  switch (step) {
    case "captureDoorstepImage":
    case "captureParcelImage":
    case "captureNeighborDoorstepImage":
    case "damagedParcelImage":
      return (
        <CameraCapture
          imageType={imageType}
          styleCard={false}
          title={label}
          buttonText={"Upload Image"}
          showCameraIcon={true}
          onComplete={onComplete}
        />
      );
    case "getNeighborDetails":
      return <NeighborDetailsForm onComplete={onComplete} />;
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
    case "showFindNeighborPromptAlert":
      return <ContactPromptAlert label={label} onClose={onComplete} />;
    case "findNeighbor":
      return <FoundNeighbor onComplete={onComplete} />;
    // case "findCustomer":
    //   return <FoundCustomer onComplete={onComplete} />;
    case "markAsNotDelivered":
      return <MarkAsNotDelivered onMarked={onComplete} />;
    case "returnToWarehouse":
      return <ReturnToWarehouse onComplete={onComplete} />;
    // case "waitForResponse":
    //   return <WaitForResponseTimeout onComplete={onComplete} />;
    case "getRating":
      return (
        <ModalWrapper onClose={() => false}>
          <StarRating onComplete={onComplete} />
        </ModalWrapper>
      );
    case "notifyForOrderReturn":
      return (
        <Notification
          title={"Order Cancelled!"}
          message={"Notification sent successfully."}
          severity={NotificationSeverity.Warning}
          onComplete={onComplete}
        />
      );
    case "showFindNeighborNotification":
      return (
        <Notification
          title={"Find Neighbors!"}
          message={"Who can accept parcel for customer."}
          severity={NotificationSeverity.Info}
          onComplete={onComplete}
        />
      );
    default:
      return null;
  }
};
