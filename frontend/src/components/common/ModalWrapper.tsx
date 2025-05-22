import React, { useState } from "react";
import {
  Box,
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
};

export const ModalWrapper = ({
  open = true,
  title,
  onClose,
  children,
}: Props) => {
  const [showModal, setShowModal] = useState(open);

  const handleModalClose = () => {
    setShowModal(false);
    onClose();
  };
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        {title && <DialogTitle>{title}</DialogTitle>}
        <IconButton onClick={handleModalClose} sx={{ ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
