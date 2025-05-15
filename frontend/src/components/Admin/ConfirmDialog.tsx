import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  content?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  content = "This action cannot be undone.",
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button
        variant="outlined"
        onClick={onCancel}
        sx={{
          background: 'linear-gradient(45deg, #f7941d 30%, #f37021 90%)',
          color: 'white', // Ensure text is visible
          border: '1px solid #f7941d', // Optional, matches the gradient colors
          '&:hover': {
            background: 'linear-gradient(45deg, #f37021 30%, #f7941d 90%)', // Hover gradient
          },
        }}
      >
        No, Cancel
      </Button>
       <Button variant="contained" color="error" onClick={onConfirm}>
          Yes, Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
