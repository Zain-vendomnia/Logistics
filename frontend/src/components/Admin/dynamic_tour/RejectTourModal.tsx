import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const modalStyle = {
  position: "absolute",
  top: "25%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

interface RejectTourModalProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}

export const RejectTourModal = ({
  open,
  onClose,
  onReject,
}: RejectTourModalProps) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleRejectClick = () => {
    const finalReason = reason === "other" ? remarks.trim() : reason;
    if (!finalReason) return;
    onReject(finalReason);
    onClose();
    setReason("");
    setRemarks("");
  };

  const isRejectDisabled =
    !reason || (reason === "other" && remarks.trim().length === 0);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...modalStyle, width: 470, p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={"bold"}>
            Do you wanna cancel this tour?
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Reason</InputLabel>
            <Select
              value={reason}
              label="Reason"
              onChange={(e) => setReason(e.target.value)}
            >
              <MenuItem value="tour optimization">Tour Optimization</MenuItem>
              <MenuItem value="any reason">Any Reason</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {reason === "other" && (
            <TextField
              fullWidth
              margin="normal"
              label="Mention reason"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          )}
        </Stack>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectClick}
            disabled={isRejectDisabled}
          >
            Reject
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
