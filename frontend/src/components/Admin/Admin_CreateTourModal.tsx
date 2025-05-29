import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  Theme, // Import Theme type for explicit typing
  Stack,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Palette, Schedule, Person } from '@mui/icons-material';
import adminApiService from '../../services/adminApiService';

import { useNavigate } from 'react-router-dom';
import { getAllDrivers } from "../../services/driverService";

interface CreateTourModalProps {
  open: boolean;
  handleClose: () => void;
  warehouseId?: number;
  orderIds?: number[];
}

interface Driver {
  id: number;
  name:string;
  warehouse_id?: number;
}

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

// Style for the date input field to reduce inline sx prop length
const dateInputSx = { '& input': { py: 1.5, height: '2em' } };

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


  const [restCheckMessage, setRestCheckMessage] = useState('');
  const [isDriverEligible, setIsDriverEligible] = useState<boolean | null>(null); // null = not checked yet

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const result = await getAllDrivers();
        setDrivers(result);
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      }
    };
    fetchDrivers();
  }, []);
const handleDriverChange = async (event: SelectChangeEvent<string | number>) => {
  const selectedId = event.target.value as number;
  setSelectedDriver(selectedId);

  try {
    const res = await adminApiService.checkDriverRest(selectedId);

    // New driver: no prior tours
    if (res.lastTourEndTime === null) {
      setIsDriverEligible(true);
      setRestCheckMessage("✅ No prior tours found. Eligible for tour.");
      return;
    }

    // Total worked this week in minutes
    const workedMinutes = res.totalWorkedHours.hours * 60 + res.totalWorkedHours.minutes;

    if (workedMinutes < 40 * 60) {
      // Under 40h → eligible
      const h = res.totalWorkedHours.hours;
      const m = res.totalWorkedHours.minutes;
      setIsDriverEligible(true);
      setRestCheckMessage(
        `✅ Driver has worked ${h}h ${m}m so far this week. Eligible for assignment.`
      );
    } else {
      // 40h or more → ineligible
      setIsDriverEligible(false);
      setRestCheckMessage(
        `❌ Driver has already worked ${res.totalWorkedHours.hours}h ${res.totalWorkedHours.minutes}m (≥ 40h). Ineligible for assignment.`
      );
    }

  } catch (error) {
    console.error("Error checking driver rest:", error);
    setIsDriverEligible(false);
    setRestCheckMessage("❌ Failed to check driver's rest status.");
  }
};

  const handleSave = async () => {
    if ( !startTime || !selectedDriver || !tourDate) {
      setSnackbar({ open: true, message: 'Please fill all required fields!', severity: 'error' });
      return;
    }
    setLoading(true);
    setIsSuccess(false);
    try {
      const response = await adminApiService.createTour({
        comments,
        startTime: `${startTime}:00`,
        routeColor,
        driverid: selectedDriver,
        tourDate: `${tourDate} 00:00:00`,
        orderIds,
        warehouseId
      });
      if (response.status === 200) {
        handleClose();
        setSnackbar({ open: true, message: 'Tour created successfully!', severity: 'success' });
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/Admin_TourTemplates');
        }, 500);
      }
    } catch (error: any) {
      console.error('Error saving tour:', error);
      const message = error?.response?.data?.message || 'Failed to save the tour. Please try again.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Common style for action buttons
  const getActionButtonSx = (currentTheme: Theme) => ({
    padding: '8px 24px',
    borderRadius: '4px',
    textTransform: 'none',
    fontWeight: '500',
    // Ensure background always has a valid string value
    background: currentTheme.palette.primary.gradient || currentTheme.palette.primary.main,
    color: "#fff", // Consider currentTheme.palette.getContrastText if background varies significantly
    transition: "all 0.3s ease",
    "&:hover": {
      background: "#fff", // Or a theme-defined hover background, e.g., currentTheme.palette.action.hover
      color: currentTheme.palette.primary.dark,
    }
  });

  return (
    <>
   <Modal open={open} onClose={handleClose}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: { xs: '90%', sm: '600px' },
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 3,
      borderRadius: 2,
      outline: 'none'
    }}
  >
    <Typography
      variant="h6"
      mb={3}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}
    >
      <Schedule fontSize="small" /> Create New Tour
    </Typography>

    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Comments"
          fullWidth
          multiline
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel><Person fontSize="small" /> Driver *</InputLabel>
          <Select
            value={selectedDriver}
            onChange={handleDriverChange}
            label="Driver *"
            required
          >
            {drivers
              .filter(d => d.warehouse_id === warehouseId)
              .map(driver => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
          </Select>
          {restCheckMessage && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                color: isDriverEligible ? 'success.main' : 'error.main'
              }}
            >
              {restCheckMessage}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Start Time *</InputLabel>
          <Select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            label="Start Time *"
            required
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Tour Date *"
          type="date"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          value={tourDate}
          onChange={(e) => setTourDate(e.target.value)}
          InputProps={{ sx: dateInputSx }}
        />
      </Grid>

      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Palette fontSize="small" color="action" />
          <Typography variant="body2">Route Color:</Typography>
          <Box
            component="input"
            type="color"
            value={routeColor}
            onChange={(e) => setRouteColor(e.target.value)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '4px',
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer'
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
      <Button
        variant="outlined"
        size="small"
        onClick={handleClose}
        sx={getActionButtonSx(theme)}
      >
        Cancel
      </Button>

      <Tooltip
        title={
          !isDriverEligible
            ? "Driver is not eligible for a new tour (already worked 40h this week)."
            : ""
        }
        arrow
      >
        <span style={{ display: 'inline-block' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={!isDriverEligible || loading || isSuccess}
            sx={{
              ...getActionButtonSx(theme),
              minWidth: 120,
              fontStyle: !isDriverEligible ? 'italic' : 'normal',
              opacity: !isDriverEligible ? 0.5 : 1,
              cursor: !isDriverEligible ? 'not-allowed' : 'pointer',
              backgroundColor: !isDriverEligible
                ? theme.palette.grey[300]
                : theme.palette.primary.main,
              color: !isDriverEligible
                ? theme.palette.text.disabled
                : theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: !isDriverEligible
                  ? theme.palette.grey[300]
                  : theme.palette.primary.dark,
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Tour'}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  </Box>
</Modal>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateTourModal;