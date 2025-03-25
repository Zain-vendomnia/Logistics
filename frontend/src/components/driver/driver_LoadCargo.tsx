import { Box, Card, Typography } from "@mui/material";
import CameraCapture from "../../common/Camera_Capture";

interface Props {
  disabled?: boolean;
  onImageUpload?: (imageUplaoded: boolean) => void;
  isMarkDone?: boolean;
}

const LoadCargo = ({ disabled = false, onImageUpload, isMarkDone = false }: Props) => {
  const handleUpload = (imageUploaded: boolean) => {
    console.log("Cargo Component: ", imageUploaded);
    onImageUpload && onImageUpload(imageUploaded);
  };

  return (
    <Box display={"flex"} flexDirection="column" width={"100%"} height="100%">
      <Typography variant="h6">Load Cargo</Typography>
      <Typography variant="body1">
        Ensure all items are laoded on the truck and take a photo.
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

export default LoadCargo;
