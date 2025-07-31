import React, { useState } from "react";
import {
  Box,
  Breakpoint,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  open?: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: Breakpoint | false;
  expandible?: boolean;
};

export const ModalWrapper = ({
  open = true,
  title,
  onClose,
  children,
  size = "sm",
  expandible = false,
}: Props) => {
  const [showModal, setShowModal] = useState(open);
  const [modalSize, setModalSize] = useState(size);
  const [expandText, setExpandText] = useState("expand");
  const handleModalSize = () => {
    switch (modalSize) {
      case "lg":
        setModalSize("md");
        setExpandText("expand");
        break;
      case "md":
        setModalSize("lg");
        setExpandText("small");
        break;
      default:
        break;
    }
  };
  const handleModalClose = () => {
    setShowModal(false);
    onClose();
  };
  return (
    <Dialog
      open={showModal}
      maxWidth={modalSize}
      fullWidth
      sx={{ zIndex: 900, overflowY: "auto" }}
    >
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
        p={0}
      >
        {title ? (
          <DialogTitle variant="h5" fontWeight={"bold"}>
            {title}
          </DialogTitle>
        ) : (
          <Box mt={3}> </Box>
        )}
        {expandible && (
          <Chip
            label={expandText}
            onClick={handleModalSize}
            color="primary"
            variant="outlined"
            sx={{ mr: 8 }}
          />
        )}
        <IconButton
          onClick={handleModalClose}
          sx={{ position: "absolute", top: 10, right: 10 }}
        >
          <CloseIcon color="primary" />
        </IconButton>
      </Box>
      <DialogContent sx={{ m: 1, mt: 0, p: 0, overflowY: "auto" }}>
        <Box>{children}</Box>
      </DialogContent>
    </Dialog>
  );
};
