import { useEffect, useState } from "react";

import { alpha, Box, IconButton, keyframes, Theme } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import theme from "../../theme";

const style = {
  contactIcon: {
    fontSize: "2.5rem",
    borderRadius: "50%",
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
    p: 0.8,
  },
};

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
  setStyle?: boolean;
  onMessageClicked: () => void;
}

const ClientContactButtons = ({
  setStyle = false,
  onMessageClicked,
}: Props) => {
  const { isContactIconsBlinking, setContactIconsBlinking } =
    useDeliveryStore();

  const handleIconClick = (action: () => void) => {
    setContactIconsBlinking(false);
    action();
  };

  return (
    <Box display={"flex"} gap={1} mx={0}>
      <IconButton
        onClick={() => handleIconClick(() => onMessageClicked())}
        color="primary"
        sx={getBlinkSx(isContactIconsBlinking)}
      >
        <CommentIcon
          fontSize="large"
          sx={setStyle ? style.contactIcon : undefined}
        />
      </IconButton>

      <IconButton
        onClick={() => handleIconClick(() => {})}
        color="primary"
        sx={getBlinkSx(isContactIconsBlinking)}
      >
        <CallIcon
          fontSize="large"
          sx={setStyle ? style.contactIcon : undefined}
        />
      </IconButton>
    </Box>
  );
};

export default ClientContactButtons;
