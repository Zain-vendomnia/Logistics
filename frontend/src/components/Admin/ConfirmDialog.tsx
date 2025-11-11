import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  content?: string;
  confirmText?: string; // ✅ Dynamic confirm button text
  cancelText?: string;  // ✅ Dynamic cancel button text (optional)
  confirmColor?: "error" | "primary" | "secondary" | "success" | "warning" | "info"; // ✅ Dynamic button color
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  content = "This action cannot be undone.",
  confirmText = "Yes, Confirm", // ✅ Default text
  cancelText = "No, Cancel",    // ✅ Default text
  confirmColor = "error",        // ✅ Default color
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={onCancel}
          sx={{
            background: 'linear-gradient(45deg, #f7941d 30%, #f37021 90%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #f37021 30%, #f7941d 90%)',
            },
          }}
        >
          {cancelText}
        </Button>
        <Button 
          variant="contained" 
          color={confirmColor} 
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;