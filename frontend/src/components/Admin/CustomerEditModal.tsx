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
  Alert,
  InputAdornment,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import adminApiService from '../../services/adminApiService';

interface Props {
  open: boolean;
  onClose: () => void;
  customer: any;
  color: string;
  onSave?: (updatedCustomer: any) => void;
}
const CustomInput = ({
  label,
  value,
  onChange,
  startAdornment = null
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startAdornment?: React.ReactNode;
}) => (
  <TextField
    label={label}
    value={value}
    fullWidth
    onChange={onChange}
    InputProps={{
      startAdornment,
      sx: {
        borderRadius: 2,
      }
    }}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: '#f5f5f5',
      },
      '& label.Mui-focused': { color: '#555' },
      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#888',
      }
    }}
  />
);

const CustomerEditModal: React.FC<Props> = ({ open, onClose, customer, color, onSave }) => {
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

      if (onSave) {
        onSave({ ...customer, ...updatedData });
      }

      onClose();
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
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: 6,
            backgroundColor: '#fafafa',
          }
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <DialogTitle sx={{ m: 0, p: 0, color: 'inherit', fontWeight: 'bold' }}>
            Edit Customer Info
          </DialogTitle>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {customer ? (
          <>
            <DialogContent sx={{ py: 3 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: '#ffffff',
                }}
              >
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField label="First Name" value={customer.firstname} fullWidth disabled
                    InputProps={{
                      sx: {
                        fontSize: '1.0rem', // 👈 Input text size
                        fontFamily: 'Poppins, sans-serif',
                        color: 'text.primary',
                        mt: 1.5 // Ensures text is visible even when disabled
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: '1.3rem', // 👈 Label text size
                        fontFamily: 'Poppins, sans-serif'
                      }
                    }}
                  />

                  <TextField label="Last Name" value={customer.lastname} fullWidth disabled  InputProps={{
                      sx: {
                        fontSize: '1.0rem', // 👈 Input text size
                        fontFamily: 'Poppins, sans-serif',
                        color: 'text.primary',
                        mt: 1.5 // Ensures text is visible even when disabled
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: '1.3rem', // 👈 Label text size
                        fontFamily: 'Poppins, sans-serif'
                      }
                    }}/>
                  <TextField label="Order Number" value={customer.order_number} fullWidth disabled  InputProps={{
                      sx: {
                        fontSize: '1.0rem', // 👈 Input text size
                        fontFamily: 'Poppins, sans-serif',
                        color: 'text.primary',
                        mt: 1.5// Ensures text is visible even when disabled
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: '1.3rem', // 👈 Label text size
                        fontFamily: 'Poppins, sans-serif'
                      }
                    }}/>

                  <CustomInput label="Street" value={formData.street} onChange={(e) => handleChange('street', e.target.value)} />
                  <CustomInput label="City" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
                  <CustomInput label="ZIP Code" value={formData.zipcode} onChange={(e) => handleChange('zipcode', e.target.value)} />
                  <CustomInput
                    label="Phone Number"
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'gray' }} />
                      </InputAdornment>
                    }
                  />
                </Box>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ px: 4, pb: 3 }}>
              <Button onClick={onClose} variant="contained" sx={{ backgroundColor: color }}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: color }}>
                Save
              </Button>
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
