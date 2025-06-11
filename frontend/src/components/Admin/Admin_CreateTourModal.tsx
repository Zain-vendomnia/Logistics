import React, { useState } from "react";
import {
  Modal, Box, TextField, Button, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, useTheme, Stack, Chip, Snackbar,
  Alert, CircularProgress
} from '@mui/material';
import { Palette, Schedule, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';
import {getAvailableDrivers} from '../../services/driverService';
interface CreateTourModalProps {
  open: boolean;
  handleClose: () => void;
  warehouseId?: number;
  orderIds?: number[];
}

interface Driver {
  id: number;
  name: string;
  warehouse_id?: number;
  status: number;
}

const generateTimeOptions = () =>
  Array.from({ length: 48 }, (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
  );

const CreateTourModal: React.FC<CreateTourModalProps> = ({ open, handleClose, warehouseId, orderIds }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [comments, setComments] = useState('');
  const [startTime, setStartTime] = useState('');
  const [routeColor, setRouteColor] = useState(theme.palette.primary.main);
  const [selectedDriver, setSelectedDriver] = useState<string | number>('');
  const [tourDate, setTourDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  const disableInputs = !tourDate || drivers.length === 0;

  const fetchEligibleDrivers = async (date: string) => {
    try {
      const res = await getAvailableDrivers(date, warehouseId ?? 0);
      console.log("Fetched eligible drivers:", res);
      setDrivers(res.available || []);
    } catch (err) {
      console.error("Failed to fetch eligible drivers:", err);
      setDrivers([]);
      setSnackbar({ open: true, message: 'Failed to fetch eligible drivers.', severity: 'error' });
    }
  };

  const validateForm = () => {
    const missing = [];
    if (!selectedDriver) missing.push('Driver');
    if (!startTime) missing.push('Start Time');
    if (!tourDate) missing.push('Tour Date');

    if (missing.length) {
      setSnackbar({ open: true, message: `${missing.join(', ')} required.`, severity: 'error' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await adminApiService.createTour({
        comments,
        startTime: `${startTime}:00`,
        routeColor,
        driverid: selectedDriver,
        tourDate: `${tourDate} 00:00:00`,
        orderIds,
        warehouseId
      });

      if (res.status === 200) {
        handleClose();
        setSnackbar({ open: true, message: 'Tour created successfully!', severity: 'success' });
        setIsSuccess(true);
        setTimeout(() => navigate('/Admin_TourTemplates'), 500);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save the tour.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getButtonSx = (disabled = false) => ({
    px: 3,
    py: 1,
    borderRadius: 1,
    fontWeight: 500,
    textTransform: 'none',
    background: disabled ? theme.palette.grey[300] : theme.palette.primary.main,
    color: disabled ? theme.palette.text.disabled : theme.palette.primary.contrastText,
    '&:hover': {
      background: disabled ? theme.palette.grey[300] : theme.palette.primary.dark
    }
  });

  const handleTourDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTourDate(value);
    setSelectedDriver('');
    setStartTime('');
    fetchEligibleDrivers(value);
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600 }, bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 24
        }}>
          <Typography variant="h6" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
            <Schedule fontSize="small" /> Create New Tour
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Comments" fullWidth multiline rows={2} value={comments} onChange={e => setComments(e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Tour Date *"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={tourDate}
                onChange={handleTourDateChange}
                InputProps={{ sx: { '& input': { py: 1.5, height: '2em' } } }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={disableInputs}>
                <InputLabel><Person fontSize="small" /> Driver *</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  required
                >
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={disableInputs}>
                <InputLabel>Start Time *</InputLabel>
                <Select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                >
                  {generateTimeOptions().map(time => (
                    <MenuItem key={time} value={time}>{time}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Palette fontSize="small" color="action" />
                <Typography variant="body2">Route Color:</Typography>
                <Box
                  component="input"
                  type="color"
                  value={routeColor}
                  disabled={disableInputs}
                  onChange={(e) => setRouteColor(e.target.value)}
                  sx={{
                    width: 40, height: 40, borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`, cursor: 'pointer'
                  }}
                />
                <Chip
                  label={routeColor.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: routeColor,
                    color: theme.palette.getContrastText(routeColor),
                    minWidth: 80
                  }}
                />
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
            <Button onClick={handleClose} variant="outlined" sx={getButtonSx()}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={disableInputs || loading || isSuccess}
              sx={getButtonSx(disableInputs)}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Tour'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateTourModal;
