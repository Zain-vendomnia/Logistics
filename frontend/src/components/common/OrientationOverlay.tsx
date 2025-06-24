import { Box } from "@mui/material";
import ScreenRotationIcon from "@mui/icons-material/ScreenRotation";
import ScreenRotationTwoToneIcon from "@mui/icons-material/ScreenRotationTwoTone";
import { motion } from "framer-motion";

import { useOrientationPrompt } from "../../hooks/useOrientationPrompt";

const style = {
  orientationOverlay: {
    position: "fixed",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: "#000a",
    color: "white",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 9999,
  },

  iconContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

const OrientationOverlay = () => {
  const { isPromptVisible } = useOrientationPrompt();

  if (!isPromptVisible) return null;
  //   const MotionIcon = motion(ScreenRotationIcon);
  const MotionIcon = motion(ScreenRotationTwoToneIcon);

  return (
    <Box sx={style.orientationOverlay}>
      <Box sx={style.iconContainer}>
        <MotionIcon
          sx={{ mb: "1rem", fontSize: "6rem" }}
          animate={{ rotate: [47, -50, 47] }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.7,
          }}
        />
        <p>Please rotate your device to landscape</p>
      </Box>
    </Box>
  );
};

export default OrientationOverlay;
