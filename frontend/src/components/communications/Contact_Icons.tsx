import React, { useState } from "react";

import { Box, IconButton, keyframes } from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import useStyles from "./Contact_Icons_style";

const blinkOverlay = keyframes`
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.06); }
  100% { opacity: 0.5; transform: scale(1); }
`;

interface Props {
  onMessageClicked: () => void;
}

const ContactIcons = ({ onMessageClicked }: Props) => {
  const styles = useStyles();

  const [isBlinking, setIsBlinking] = useState(true);

  const handleIconClick = (action: () => void) => {
    setIsBlinking(false);
    action();
  };

  return (
    <Box display={"flex"} gap={1} mx={0}>
      <IconButton
        onClick={() => handleIconClick(() => onMessageClicked())}
        color="primary"
        className={isBlinking ? styles.iconBlinks : undefined}
        sx={{
          animation: isBlinking ? `${blinkOverlay} 1.5s infinite` : "none",
        }}
      >
        <CommentIcon fontSize="large" />
      </IconButton>

      <IconButton
        onClick={() => handleIconClick(() => {})}
        color="primary"
        className={isBlinking ? styles.iconBlinks : undefined}
        sx={{
          animation: isBlinking ? `${blinkOverlay} 1.5s infinite` : "none",
        }}
      >
        <CallIcon fontSize="large" />
      </IconButton>
    </Box>
  );
};

export default ContactIcons;
