import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { set } from "lodash";

interface Props {
  label: string;
  onClose: () => void;
}

const ContactPromptAlert = ({ label, onClose }: Props) => {
  const store = useDeliveryStore();

  const [open, setOpen] = useState(true);
  const [desc, setDesc] = useState("");
  const [desc1, setDesc1] = useState("");

  const [title, rawLabel] = label.split(",");

  useEffect(() => {
    if (rawLabel.includes(".")) {
      const parts = rawLabel.split(".");
      setDesc(parts[0] + ".");
      setDesc1(parts[1] + ".");
    } else {
      setDesc(rawLabel);
      setDesc1("");
    }
  }, []);

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
          <Typography
            variant="body1"
            fontSize={"large"}
            id="alert-dialog-description"
          >
            {desc}
          </Typography>
          {desc1 && (
            <Typography variant="body1" fontSize={"large"}>
              {desc1}
            </Typography>
          )}
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
