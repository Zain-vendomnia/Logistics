import { useEffect, useState } from "react";

import { alpha, Box, IconButton, keyframes } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import theme from "../../theme";

const blinkOverlay = keyframes`
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.06); }
  100% { opacity: 0.5; transform: scale(1); }
`;

const getBlinkSx = (isBlinking: boolean | null) =>
  isBlinking
    ? {
        position: "relative",
        overflow: "hidden",
        animation: `${blinkOverlay} 1.5s infinite`,
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: alpha(theme.palette.primary.dark, 0.5),
          borderRadius: "50%",
        },
      }
    : {};

interface Props {
  onMessageClicked: () => void;
}

const ClientContactButtons = ({ onMessageClicked }: Props) => {
  const { isContactIconsBlinking, setContactIconsBlinking } =
    useDeliveryStore();

  const handleIconClick = (action: () => void) => {
    setContactIconsBlinking(false);
    action();
  };

  return (
    <Box display={"flex"} gap={1} mx={0}>
      {/* <IconButton
        onClick={() => handleIconClick(() => onMessageClicked())}
        color="primary"
        sx={getBlinkSx(isContactIconsBlinking)}
      >
        <CommentIcon fontSize="large" />
      </IconButton> */}

      <IconButton
        onClick={() => handleIconClick(() => {})}
        color="primary"
        sx={getBlinkSx(isContactIconsBlinking)}
      >
        <CallIcon fontSize="large" />
      </IconButton>
    </Box>
  );
};

export default ClientContactButtons;
