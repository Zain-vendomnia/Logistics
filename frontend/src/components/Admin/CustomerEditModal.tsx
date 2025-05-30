import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  IconButton,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import adminApiService from '../../services/adminApiService'; 

interface Props {
  open: boolean;
  onClose: () => void;
  customer: any;
  color: string;
}

const CustomerEditModal: React.FC<Props> = ({ open, onClose, customer, color }) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    zipcode: '',
    phone_number: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        street: customer.street || '',
        city: customer.city || '',
        zipcode: customer.zipcode || '',
        phone_number: customer.phone || ''
      });
      setErrors({});
    }
  }, [customer, open]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    // Street: required
    if (!formData.street.trim()) {
      e.street = 'Street is required';
    }

    // City: required, letters and spaces only
    if (!formData.city.trim()) {
      e.city = 'City is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.city)) {
      e.city = 'City must contain only letters';
    }

    // ZIP Code: required, digits only (German format 5 digits)
    if (!formData.zipcode.trim()) {
      e.zipcode = 'ZIP code is required';
    } else if (!/^\d{5}$/.test(formData.zipcode)) {
      e.zipcode = 'Enter valid 5-digit ZIP code';
    }

    // Phone Number: required, German format
    if (!formData.phone_number.trim()) {
      e.phone_number = 'Phone number is required';
    } else if (!/^\+49\d{10,12}$/.test(formData.phone_number)) {
      e.phone_number = 'Enter valid German phone number (starts +49, 10–12 digits)';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const updatedData = {
      order_id: customer.order_id,
      street: formData.street,
      city: formData.city,
      zipcode: formData.zipcode,
      phone: formData.phone_number
    };

    try {
      await adminApiService.updateCustomerInfo(updatedData);
      setSnackbar({ open: true, message: 'Customer info updated successfully', severity: 'success' });
      setTimeout(onClose, 300);
    } catch (error) {
      console.error('Error updating customer:', error);
      setSnackbar({ open: true, message: 'Failed to update customer info', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: color, color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          Edit Customer Info
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {customer ? (
            <Box mt={2} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="First Name"
                value={customer.firstname}
                fullWidth
                disabled
              />
              <TextField
                label="Last Name"
                value={customer.lastname}
                fullWidth
                disabled
              />
              <TextField
                label="Order Number"
                value={customer.order_number}
                fullWidth
                disabled
              />

              <TextField
                label="Street"
                value={formData.street}
                fullWidth
                onChange={handleChange('street')}
                error={!!errors.street}
                helperText={errors.street}
              />
              <TextField
                label="City"
                value={formData.city}
                fullWidth
                onChange={handleChange('city')}
                error={!!errors.city}
                helperText={errors.city}
              />
              <TextField
                label="ZIP Code"
                value={formData.zipcode}
                fullWidth
                onChange={handleChange('zipcode')}
                error={!!errors.zipcode}
                helperText={errors.zipcode}
              />
              <TextField
                label="Phone Number"
                value={formData.phone_number}
                fullWidth
                onChange={handleChange('phone_number')}
                error={!!errors.phone_number}
                helperText={errors.phone_number}
              />
            </Box>
          ) : (
            <Box my={2}>Loading customer info...</Box>
          )}
        </DialogContent>

        {customer && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} variant="outlined">Cancel</Button>
            <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: color }}>
              Save
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomerEditModal;
