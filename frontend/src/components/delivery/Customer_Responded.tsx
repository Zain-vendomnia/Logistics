import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Snackbar,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryScenario } from "./delieryScenarios";

const CustomerResponses = [
  "Leave the parcal at the door step",
  "Drop it to a neighbor",
  "Reschedule delivery",
];

interface Props {
  onComplete: (found: boolean) => void;
}
const CustomerResponded = ({ onComplete }: Props) => {
  const { deliveryId, setScenario, updateDeliveryState } = useDeliveryStore();

  const [showAlert, setShowAlert] = useState(true);
  const [showDialogue, setShowDialogue] = useState(false);

  const [selectedResponse, setSelectedResponse] = useState<string>("");

  const handleAlertClose = () => {
    setShowAlert(false);
    setShowDialogue(true);
    console.log("Customer Responded clicked");
  };

  const evaluateResponseScenario = (res: string) => {
    switch (res) {
      case "Leave the parcal at the door step":
        return DeliveryScenario.hasPermit;
      case "Drop it to a neighbor":
        return DeliveryScenario.neighborAccepts;
      case "Reschedule delivery":
        return DeliveryScenario.noAcceptance;
      default:
        return DeliveryScenario.foundCustomer;
    }
  };
  const handleDialogueClose = () => {
    setShowDialogue(false);
    if (selectedResponse) {
      const resScenario = evaluateResponseScenario(selectedResponse);

      setScenario(deliveryId, resScenario);
      updateDeliveryState({ customerResponded: true });
      onComplete(true);
    } else {
      setShowAlert(true);
      onComplete(false);
    }
  };
  const handleResponseSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedResponse(event.target.value);
    console.log("Customer Responded Scenario: ", event.target.value);
  };

  return (
    <>
      <Snackbar
        open={showAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          icon={false}
          variant="filled"
          severity={"info"}
          sx={{ minWidth: "290px", mt: 8 }}
          // onClose={handleClose}
          // action={actionButton}
        >
          <Box
            display="flex"
            alignItems={"center"}
            justifyContent="space-between"
            gap={1}
          >
            <Typography variant="body1" fontSize={"large"} fontWeight={"bold"}>
              Get customer response?
            </Typography>
            <Button variant="contained" size="small" onClick={handleAlertClose}>
              YES
            </Button>
          </Box>
        </Alert>
      </Snackbar>

      {showDialogue && (
        <Dialog
          onClose={handleDialogueClose}
          aria-labelledby="response-dialog-title"
          open={true}
        >
          <DialogTitle id="response-dialog-title">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h5">Customer Requests To:</Typography>
              <IconButton onClick={handleDialogueClose}>
                <CloseIcon color="primary" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ height: "220px", width: "600px" }}>
            <FormControl>
              <RadioGroup
                aria-labelledby="customer-response-radio"
                defaultValue={selectedResponse ?? ""}
                name="radio-buttons-group"
                value={selectedResponse}
                onChange={handleResponseSelection}
              >
                {CustomerResponses.map((response, index) => (
                  <FormControlLabel
                    key={index}
                    value={response}
                    control={<Radio />}
                    label={response}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleDialogueClose} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default CustomerResponded;
