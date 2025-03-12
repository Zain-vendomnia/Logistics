import { Box, Typography } from "@mui/material";
import CameraCapture from "../../common/Camera_Capture";

const LoadCargo = () => {
  return (
    <Box display={"flex"} flexDirection="column" width={"100%"} height="100%">
      <Typography variant="h6">Load Cargo</Typography>
      <Typography variant="body1">
        Take a photo when items are loaded in the truck.
      </Typography>
      <Box mt={"auto"} mx={"auto"}>
        <CameraCapture buttonText={"Upload Image"} />
      </Box>
    </Box>
  );
};

export default LoadCargo;
