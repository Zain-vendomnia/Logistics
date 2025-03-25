import { Box, Typography } from "@mui/material";
import CameraCapture from "../../common/Camera_Capture";

interface Props {
  disabled?: boolean;
  onImageUpload?: (imageUplaoded: boolean) => void;
  isMarkDone?: boolean;
}

const OrderShipping = ({
  disabled = false,
  onImageUpload,
  isMarkDone = false,
}: Props) => {
  return (
    <Box display={"flex"} flexDirection="column" width={"100%"} height="100%">
      <Typography variant="h6">Check Odometer</Typography>
      <Typography variant="body1">
        Kilometers Driven and Fuel Guage photo from the odometer.
      </Typography>
      <Box mt={"auto"} mx={"auto"}>
        <CameraCapture
          buttonText={"Upload Image"}
          buttonDisabled={disabled}
          onUpload={(result) => onImageUpload && onImageUpload(result)}
          isMarkDone={isMarkDone}
        />
      </Box>
    </Box>
  );
};

export default OrderShipping;
