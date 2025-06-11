import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Divider, Box, Slide, Fade,
  Chip, IconButton
} from '@mui/material';
import {
  CheckCircle, Error, Info, Close, SwapHoriz, LocationOn, Route
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';

export interface ConfirmationRow {
  from: string;
  to: string;
  distance: string;
  isEditedCustomer?: boolean;
}

interface Props {
  open: boolean;
  data: ConfirmationRow[];
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  showColumnHeaders?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
}

const SlideTransition = React.forwardRef((props: TransitionProps & { children: React.ReactElement }, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
const FadeTransition = React.forwardRef((props: TransitionProps & { children: React.ReactElement }, ref) => (
  <Fade ref={ref} {...props} />
));

const ConfirmationDialog: React.FC<Props> = ({
  open, data, onCancel, onConfirm,
  title = "Confirm Updates?", confirmText = "Update", cancelText = "Cancel",
  showColumnHeaders = true, animationType = 'slide'
}) => {
  const Transition = animationType === 'fade' ? FadeTransition : animationType === 'slide' ? SlideTransition : undefined;
  const edited = data.filter(r => r.isEditedCustomer);
  const editedCount = edited.length;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth TransitionComponent={Transition} transitionDuration={300}
      PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Info color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onCancel} size="small" sx={{ color: 'text.secondary' }}><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <Box mb={2} display="flex" gap={1} flexWrap="wrap">
          {editedCount > 0 &&
            <Chip icon={<Error />} label={`${editedCount} Modified Order Address`} color="error" variant="outlined" size="small" />}
        </Box>

        <Stack spacing={2}>
          {showColumnHeaders && (
            <>
              <Box display="grid" gridTemplateColumns="1fr auto 1fr auto" gap={2} alignItems="center"
                sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                {['Order ID', 'Distance', 'Destination', 'Status'].map((label, i) => (
                  <Typography key={i} variant="subtitle2" color="text.secondary" fontWeight={600}>
                    {[<LocationOn />, <Route />, <LocationOn />, null][i]} {label}
                  </Typography>
                ))}
              </Box>
              <Divider />
            </>
          )}

          {data.map((row, i) => (
            <Fade in key={i} timeout={300 + i * 100}>
              <Box display="grid" gridTemplateColumns="1fr auto 1fr auto" gap={2} alignItems="center"
                sx={{
                  p: 2, borderRadius: 1, border: '1px solid',
                  borderColor: row.isEditedCustomer ? 'error.light' : 'divider',
                  bgcolor: row.isEditedCustomer ? 'error.lighter' : 'background.paper',
                  transition: '0.2s', '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(-1px)'
                  }
                }}>
                <Typography variant="subtitle1" color={row.isEditedCustomer ? 'error.main' : 'text.primary'} fontWeight={500}>
                  {row.from}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <SwapHoriz fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 0.5, fontWeight: 500 }}>
                    {row.distance}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" fontWeight={500}>{row.to}</Typography>
                <Box display="flex" justifyContent="center">{row.isEditedCustomer
                  ? <Error color="error" fontSize="small" />
                  : <CheckCircle color="success" fontSize="small" />}</Box>
              </Box>
            </Fade>
          ))}
        </Stack>

        {/* {editedCount > 0 && (
          <Box mt={2} p={2} sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              {editedCount} order{editedCount > 1 ? 's have' : ' has'} been modified and may require special attention.
            </Typography>
          </Box>
        )} */}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined" startIcon={<Close />} sx={{
          color: '#d32f2f !important', borderColor: '#d32f2f',
          '&:hover': {
            borderColor: '#9a0007', bgcolor: 'rgba(211,47,47,0.04)', color: '#9a0007', transform: 'scale(1.02)'
          },
          transition: '0.2s',
        }}>{cancelText}</Button>
        <Button onClick={onConfirm} color="success" variant="contained" startIcon={<CheckCircle />}
          sx={{ '&:hover': { transform: 'scale(1.02)' }, transition: '0.2s' }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
