import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useDeliveryStore } from "../../store/useDeliveryStore";

interface Props {
  //   show?: boolean;
  onClose: () => void;
}

const ContactPromptAlert = ({ onClose }: Props) => {
  const store = useDeliveryStore();

  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle variant={"h4"} fontWeight={"bold"} id="alert-dialog-title">
          {"Contact Customer"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            variant="body1"
            fontSize={"large"}
            fontWeight={"bold"}
            id="alert-dialog-description"
          >
            Reach out to the customer via SMS or Call for further communication.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {/* <Button onClick={handleClose} color="primary">
            Disagree
          </Button> */}
          <Button variant="contained" onClick={handleClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ContactPromptAlert;
