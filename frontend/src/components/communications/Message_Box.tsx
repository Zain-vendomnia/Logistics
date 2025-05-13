import React from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";

import useStyles from "./Message_Box_style";

const quickMessages = [
  "Arriving soon",
  "I'm nearby",
  "I'm arrived",
  "At your doorstep",
];

interface Props {
  onClose: (clicked: boolean) => void;
}

const MessageBox = ({ onClose }: Props) => {
  const styles = useStyles();

  return (
    <Box className={styles.messageBox_bg}>
      <Box className={styles.messageBox}>
        <Typography variant="h6" fontWeight={"bold"} color={grey[900]}>
          Send Message
        </Typography>
        <IconButton onClick={() => onClose(true)} sx={{ color: "grey.900" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {quickMessages.map((item) => (
        <Chip
          className={styles.chip}
          key={item}
          label={item}
          variant="outlined"
        />
      ))}
    </Box>
  );
};

export default MessageBox;
