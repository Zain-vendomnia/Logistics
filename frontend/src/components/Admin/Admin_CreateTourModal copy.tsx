import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import axios from 'axios';

import latestOrderServices from './AdminServices/latestOrderServices';
import { useNavigate } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '600px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const generateTimeOptions = () => {
  const options: string[] = [];
  const times = ['AM', 'PM'];

  for (let h = 1; h <= 12; h++) {
    for (let m = 0; m < 60; m += 30) {
      const minuteStr = m === 0 ? '00' : '30';
      times.forEach((ampm) => {
        options.push(`${h.toString().padStart(2, '0')}:${minuteStr} ${ampm}`);
      });
    }
  }

  return options;
};

interface CreateTourModalProps {
  open: boolean;
  handleClose: () => void;
  orderIds: number[];
}

const CreateTourModal: React.FC<CreateTourModalProps> = ({ open, handleClose, orderIds  }) => {
  const [tourName, setTourName] = useState('');
  const [comments, setComments] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleProfile, setVehicleProfile] = useState('Transporter');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [routeColor, setRouteColor] = useState('#FF5733'); // Default white color
  const [selectedDriver, setSelectedDriver] = useState<string | number>('');
  const [tourDate, setTourDate] = useState('');
  const timeOptions = generateTimeOptions();

  const data = latestOrderServices.getInstance();
  const drivers = data.getDrivers();
 console.log("🚀 Drivers: ---> create tour modal", drivers);
  const navigate = useNavigate();

  // Update to accept SelectChangeEvent<string | number>
  const handleDriverChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedDriver(event.target.value);
  };

  const handleSave = async () => {
    if (!tourName || !startTime || !endTime || !selectedDriver) {
      alert('Please fill all required fields!');
      return;
    }

    const tourData = {
      tourName,
      comments,
      startTime,
      endTime,
      maxQuantity,
      routeColor,
      driverid: selectedDriver,
      tourDate: formatDateToTimestamp(tourDate),
      orderIds,
    };

    try {
      //const response = await axios.post('http://localhost:8080/api/admin/routeoptimize/createtour', tourData);

      const response = await adminApiService.createTour(tourData);
      if (response.status === 200) {
        console.log('Tour Saved:', response.data);
        alert('Tour saved successfully!');
        navigate('/Admin_TourTemplates');
        handleClose(); // Close modal after saving
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Failed to save the tour');
    }
  };

  const formatDateToTimestamp = (dateStr: string): string => {
    return `${dateStr} 00:00:00`;
  };
  
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>
          Create Tour
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Tour Name"
              required
              fullWidth
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
            />
          </Grid>
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

          {/* Driver Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Driver</InputLabel>
              <Select
                value={selectedDriver}
                onChange={handleDriverChange}
                label="Driver *"
                required
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver.driver_id} value={driver.driver_id}>
                    {driver.driver_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Working Hour From</InputLabel>
              <Select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                label="Working Hour From *"
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

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Working Hour To</InputLabel>
              <Select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                label="Working Hour To *"
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
              label="Tour Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              {/* Label */}
              <Typography
                variant="body1"
                sx={{
                  minWidth: '130px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                Change the route color:
              </Typography>

              {/* Color Picker */}
              <Box
                component="input"
                type="color"
                value={routeColor}
                onChange={(e) => setRouteColor(e.target.value)}
              />

              {/* Display Selected HEX */}
              <Typography
                variant="body1"
                sx={{
                  minWidth: '80px',
                  fontWeight: '500',
                  color: routeColor === '#FFFFFF' ? '#000' : '#333', // Text color contrast for white background
                }}
              >
                {routeColor.toUpperCase()}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CreateTourModal;
