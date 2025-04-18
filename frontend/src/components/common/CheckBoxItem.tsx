import { ReactNode } from "react";
import CameraCapture from "./Camera_Capture";
import { Box, Stack, Typography } from "@mui/material";
import { useSnackbar } from "../../providers/SnackbarProvider";

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
  const { showSnackbar } = useSnackbar();

  const handleComplete = (result: boolean) => {
    onImageUpload?.(result);
    showSnackbar(`${title} Completed!`, "success");
  };

  return (
    <Box
      display={"flex"}
      gap={"5vh"}
      flexDirection="column"
      width={"100%"}
      height="100%"
    >
      <Stack spacing={1} width={"100%"}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body1">{description}</Typography>
      </Stack>
      <Box mt={"auto"}>
        <CameraCapture
          buttonText={"Upload Image"}
          showCameraIcon={showCameraIcon}
          buttonDisabled={disabled}
          onComplete={(result) => handleComplete(result)}
          isMarkDone={isMarkDone}
        />
      </Box>
    </Box>
  );
};

export default CheckBoxItem;