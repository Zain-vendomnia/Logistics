import React, { useState } from "react";
import {
  Box,
  Breakpoint,
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
};

export const ModalWrapper = ({
  open = true,
  title,
  onClose,
  children,
  size = "sm",
}: Props) => {
  const [showModal, setShowModal] = useState(open);

  const handleModalClose = () => {
    setShowModal(false);
    onClose();
  };
  return (
    <Dialog
      open={showModal}
      maxWidth={size}
      fullWidth
      sx={{ zIndex: 1500, overflowY: "auto" }}
    >
      <Box
        display={"flex"}
        alignItems={"flex-start"}
        justifyContent={"space-between"}
        p={1}
      >
        {title ? (
          <DialogTitle variant="h5" fontWeight={"bold"}>
            {title}
          </DialogTitle>
        ) : (
          <Box mt={3}> </Box>
        )}
        <IconButton
          onClick={handleModalClose}
          sx={{ position: "absolute", top: 10, right: 10 }}
        >
          <CloseIcon color="primary" />
        </IconButton>
      </Box>
      <DialogContent sx={{ m: 0, mb: 5, p: 0, overflowY: "auto" }}>
        <Box m={1}>{children}</Box>
      </DialogContent>
    </Dialog>
  );
};
