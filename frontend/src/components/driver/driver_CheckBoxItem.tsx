import { ReactNode } from "react";
import CameraCapture from "../../common/Camera_Capture";
import { Box, Typography } from "@mui/material";

interface Props {
  title: ReactNode;
  description?: string;
  showCameraIcon?: boolean;
  disabled?: boolean;
  isMarkDone?: boolean;
  onImageUpload?: (imageUplaoded: boolean) => void;
}

const CheckBoxItem = ({
  title = "",
  description = "",
  disabled = false,
  showCameraIcon = false,
  isMarkDone = false,
  onImageUpload,
}: Props) => {
  return (
    <Box
      display={"flex"}
      gap={!isMarkDone ? "8vh" : "5vh"}
      flexDirection="column"
      width={"100%"}
      height="100%"
    >
      <Box>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2">{description}</Typography>
      </Box>
      <Box mt={"auto"} mx={"auto"}>
        <CameraCapture
          buttonText={"Upload Image"}
          showCameraIcon={showCameraIcon}
          buttonDisabled={disabled}
          onUpload={(result) => onImageUpload && onImageUpload(result)}
          isMarkDone={isMarkDone}
        />
      </Box>
    </Box>
  );
};

export default CheckBoxItem;
