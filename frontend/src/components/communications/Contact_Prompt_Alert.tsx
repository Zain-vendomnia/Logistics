import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useDeliveryStore } from "../../store/useDeliveryStore";

interface Props {
  label: string;
  onClose: () => void;
}

const ContactPromptAlert = ({ label, onClose }: Props) => {
  const store = useDeliveryStore();

  const title = label.split(",")[0];
  label = label.split(",")[1];

  const [open, setOpen] = useState(true);

  const handleClose = () => {
    // if (title.includes("Customer")) {
    // }
    store.setContactIconsBlinking(true);
    setOpen(false);
    onClose();
  };

  return (
    <Box>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        slotProps={{
          paper: {
            sx: {
              width: 600,
              maxWidth: "none",
              p: 1,
              pr: 2,
            },
          },
        }}
      >
        <DialogTitle variant={"h4"} fontWeight={"bold"} id="alert-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            variant="body1"
            fontSize={"large"}
            fontWeight={"bold"}
            id="alert-dialog-description"
          >
            {label}
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
    </Box>
  );
};

export default ContactPromptAlert;
