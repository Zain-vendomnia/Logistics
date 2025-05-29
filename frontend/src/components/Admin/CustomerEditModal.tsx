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
    }
  }, [customer]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const updatedData = {
      order_id: customer.order_id,
      street: formData.street,
      city: formData.city,
      zipcode: formData.zipcode,
      phone: formData.phone_number
    };

    try {
      const response = await adminApiService.updateCustomerInfo(updatedData);
      console.log("✅ Customer update success:", response.data);

      setSnackbar({
        open: true,
        message: "Customer info updated successfully",
        severity: 'success'
      });

      onClose(); // Optionally delay this if you want the snackbar to remain longer
    } catch (error) {
      console.error("❌ Error updating customer:", error);

      setSnackbar({
        open: true,
        message: "Failed to update customer info",
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
   <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ backgroundColor: color, color: 'white', display: 'flex', justifyContent: 'space-between' }}>
    Edit Customer Info
    <IconButton onClick={onClose} sx={{ color: 'white' }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  {customer ? (
    <>
      <DialogContent>
        <Box mt={2} display="flex" flexDirection="column" gap={2}>
          <TextField label="First Name" value={customer.firstname} fullWidth disabled />
          <TextField label="Last Name" value={customer.lastname} fullWidth disabled />
          <TextField label="Order Number" value={customer.order_number} fullWidth disabled />
          <TextField
            label="Street"
            value={formData.street}
            fullWidth
            onChange={(e) => handleChange('street', e.target.value)}
          />
          <TextField
            label="City"
            value={formData.city}
            fullWidth
            onChange={(e) => handleChange('city', e.target.value)}
          />
          <TextField
            label="ZIP Code"
            value={formData.zipcode}
            fullWidth
            onChange={(e) => handleChange('zipcode', e.target.value)}
          />
          <TextField
            label="Phone Number"
            value={formData.phone_number}
            fullWidth
            onChange={(e) => handleChange('phone_number', e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: color }}>Save</Button>
      </DialogActions>
    </>
  ) : (
    <DialogContent>
      <Box>Loading customer info...</Box>
    </DialogContent>
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
