import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import adminApiService from '../../services/adminApiService';
import latestOrderServices from './AdminServices/latestOrderServices';

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
  ['AM', 'PM'].forEach(ampm => {
    for (let h = 1; h <= 12; h++) {
      ['00', '30'].forEach(minute => {
        options.push(`${h}:${minute} ${ampm}`);
      });
    }
  });
  return options;
};

interface EditTourModalProps {
  open: boolean;
  handleClose: () => void;
  tourData: any;
  onTourUpdated: () => void;
}

interface Driver {
  driver_id: string | number;
  driver_name: string;
}

const EditTourModal: React.FC<EditTourModalProps> = ({
  open,
  handleClose,
  tourData,
  onTourUpdated,
}) => {
  const [tourName, setTourName] = useState('');
  const [comments, setComments] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [routeColor, setRouteColor] = useState('#FF5733');
  const [selectedDriver, setSelectedDriver] = useState<string | number>('');
  const [tourDate, setTourDate] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (open) fetchDrivers();
  }, [open]);

  useEffect(() => {
    if (tourData) {
      const { tour_name, tour_comments, color, date, timeRange, driver_id } = tourData;
      setTourName(tour_name || '');
      setComments(tour_comments || '');
      setRouteColor(color || '#FF5733');
      setTourDate(date ? formatDateForInput(date) : '');
      if (timeRange) setTimeRange(timeRange);
      setSelectedDriver(driver_id || '');
    }
  }, [tourData]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const driversData = await latestOrderServices.getInstance().fetchAllDrivers();
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const setTimeRange = (timeRange: string) => {
    const [start, end] = timeRange.split(' - ');
    setStartTime(formatTime(start, 'AM'));
    setEndTime(formatTime(end, 'PM'));
  };

  const formatTime = (time: string, period: string) => {
    const [hour, minute] = time.split(':');
    const formattedHour = parseInt(hour, 10) % 12 || 12;
    return `${formattedHour}:${minute} ${period}`;
  };

  const formatDateForInput = (dateString: string) => {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleDriverChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedDriver(event.target.value);
  };

  const handleSave = async () => {
    if (!tourName || !startTime || !endTime || !selectedDriver || !tourDate) {
      alert('Please fill all required fields!');
      return;
    }

    const selectedDriverObj = drivers.find(d => d.driver_id === selectedDriver);
    if (!selectedDriverObj) {
      alert('Selected driver is invalid!');
      return;
    }

    const updatedTourData = {
      id: tourData?.id,
      tourName,
      comments,
      startTime,
      endTime,
      routeColor,
      driverid: selectedDriver,
      driverName: selectedDriverObj.driver_name,
      tourDate: `${tourDate} 00:00:00`,
    };

    try {
      setLoading(true);
      await adminApiService.updateTour(updatedTourData); // Update the tour in the backend
      console.log('Tour data to save:', updatedTourData);
  
      // After successfully saving, refresh the data
      onTourUpdated(); 
      // console.log('Updated data:', UpdatedData);
      handleClose();
    } catch (error) {
      console.error('Error updating tour:', error);
      alert('Failed to update the tour. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>Edit Tour</Typography>
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

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Driver *</InputLabel>
              <Select
                value={selectedDriver}
                onChange={handleDriverChange}
                label="Driver *"
                required
                disabled={loading || drivers.length === 0}
              >
                {drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <MenuItem key={driver.driver_id} value={driver.driver_id}>
                      {driver.driver_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>{loading ? 'Loading drivers...' : 'No drivers available'}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Working Hour From *</InputLabel>
              <Select value={startTime} onChange={(e) => setStartTime(e.target.value)} label="Working Hour From *" required>
                {timeOptions.map((time) => (
                  <MenuItem key={time} value={time}>{time}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Working Hour To *</InputLabel>
              <Select value={endTime} onChange={(e) => setEndTime(e.target.value)} label="Working Hour To *" required>
                {timeOptions.map((time) => (
                  <MenuItem key={time} value={time}>{time}</MenuItem>
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
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body1" sx={{ minWidth: '130px', fontWeight: '500' }}>Route color:</Typography>
              <input
                type="color"
                value={routeColor}
                onChange={(e) => setRouteColor(e.target.value)}
                style={{ width: '50px', height: '30px' }}
              />
              <Typography variant="body1" sx={{ minWidth: '80px', fontWeight: '500' }}>{routeColor.toUpperCase()}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditTourModal;
