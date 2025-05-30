import React from 'react';
import { Modal, Box, Typography, Fade, Backdrop } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={isOpen}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            minWidth: 300,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 70, color: '#ef972e' }} />
          <Typography variant="h5" mt={2} mb={1}>
            Vielen Dank!
          </Typography>
          <Typography variant="body1">Ihr Formular wurde erfolgreich übermittelt.</Typography>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ThankYouModal;
