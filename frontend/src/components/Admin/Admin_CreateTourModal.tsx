import React, { useState } from 'react';
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
  Stack,
  Chip
} from '@mui/material';
import { Palette, Schedule, Person } from '@mui/icons-material';
import adminApiService from '../../services/adminApiService';
import { useNavigate } from 'react-router-dom';
import latestOrderServices from './AdminServices/latestOrderServices';

interface CreateTourModalProps {
  open: boolean;
  handleClose: () => void;
  warehouseId?: number;
  orderIds: number[];
}

interface Driver {
  driver_id: number | string;
  driver_name: string;
  warehouse_id?: number ;
}

const CreateTourModal: React.FC<CreateTourModalProps> = ({ open, handleClose,warehouseId, orderIds }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  // Form state
  const [tourName, setTourName] = useState('');
  const [comments, setComments] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [routeColor, setRouteColor] = useState(theme.palette.primary.main);
  const [selectedDriver, setSelectedDriver] = useState<string | number>('');
  const [tourDate, setTourDate] = useState('');

  // Get drivers data
  
  const drivers: Driver[] = latestOrderServices.getInstance().getDrivers();



  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour}:00 ${period}`;
  });

  const handleDriverChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedDriver(event.target.value);
  };

  const handleSave = async () => {
    if (!tourName || !startTime || !endTime || !selectedDriver || !tourDate) {
      alert('Please fill all required fields!');
      return;
    }

    try {
      const response = await adminApiService.createTour({
        tourName,
        comments,
        startTime,
        endTime,
        routeColor,
        driverid: selectedDriver,
        tourDate: `${tourDate} 00:00:00`,
        orderIds,
      });

      if (response.status === 200) {
        navigate('/Admin_TourTemplates');
        handleClose();
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Failed to save the tour');
    }
  };

  return (
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
        <Typography variant="h6" mb={3} sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <Schedule fontSize="small" /> Create New Tour
        </Typography>

        <Grid container spacing={2}>
          {/* Tour Name */}
          <Grid item xs={12}>
            <TextField
              label="Tour Name"
              required
              fullWidth
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
              variant="outlined"
              size="medium"
            />
          </Grid>

          {/* Comments */}
          <Grid item xs={12}>
            <TextField
              label="Comments"
              fullWidth
              multiline
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              variant="outlined"
              size="medium"
            />
          </Grid>

          {/* Driver Selection */}
          <Grid item xs={12}>
          <FormControl fullWidth size="medium">
          <InputLabel sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" /> Driver *
          </InputLabel>
          <Select
            value={selectedDriver}
            onChange={handleDriverChange}
            label="Driver *"
            required
            size="medium"
          >
          {drivers
          .filter(driver => driver.warehouse_id === warehouseId)
          .map((driver) => (
            <MenuItem key={driver.driver_id} value={driver.driver_id}>
              {driver.driver_name}
            </MenuItem>
        ))}
           
          </Select>
        </FormControl>
          </Grid>

          {/* Time Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Start Time *</InputLabel>
              <Select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                label="Start Time *"
                required
                size="medium"
              >
                {timeOptions.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>End Time *</InputLabel>
              <Select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                label="End Time *"
                required
                size="medium"
              >
                {timeOptions.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tour Date */}
          <Grid item xs={12}>
            <TextField
              label="Tour Date *"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
              variant="outlined"
              size="medium"
              InputProps={{
                sx: { 
                  '& input': { 
                    py: 1.5,  // Increased padding for taller input
                    height: '2em'  // Explicit height control
                  }
                }
              }}
            />
          </Grid>

          {/* Route Color */}
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
                  cursor: 'pointer',
                  p: 0
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

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
          <Button 
            variant="outlined" 
            onClick={handleClose}
            sx={{ px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{ px: 3 }}
          >
            Create Tour
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default CreateTourModal;