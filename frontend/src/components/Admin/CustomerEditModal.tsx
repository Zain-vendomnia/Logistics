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
import ConfirmationDialog from './confirmationModal';
interface Props {
  open: boolean;
  onClose: () => void;
  customer: any;
  allCustomers: any;
  color: string;
  notice?: string;
  tourId: string | undefined; 
  onSave?: (updatedCustomer: any) => void;
}
interface ConfirmationRow {
  from: string;
  to: string;
  distance: string;
  isEditedCustomer: boolean;
}
const CustomInput = ({
  label,
  value,
  onChange,
  startAdornment = null,
  error = '',
  helperText = '',
  inputProps
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startAdornment?: React.ReactNode;
  error?: string;
  helperText?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) => (
  <TextField
    label={label}
    value={value}
    fullWidth
    onChange={onChange}
    error={!!error}
    helperText={error || helperText}
    InputProps={{
      startAdornment,
      sx: { borderRadius: 2 },
    }}
    inputProps={inputProps} // Only applies if passed
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
const CustomerEditModal: React.FC<Props> = ({ open, onClose, customer,allCustomers, color,tourId, onSave }) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    zipcode: '',
    phone_number: '',
    notice: '',
    tourId: ''
  });
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationRow[]>([]);
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  // const [allCustomers, setAllCustomers] = useState<any[]>([]);

  // console.log("customer"+ JSON.stringify(formData));
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

  const hasAddressChanged = () => {
    return (
      customer.street !== formData.street ||
      customer.city !== formData.city ||
      customer.zipcode !== formData.zipcode
    );
  };

  useEffect(() => {
    if (customer) {
      console.log("Customer data:", customer);
      setFormData({
        street: customer.street || '',
        city: customer.city || '',
        zipcode: customer.zipcode || '',
        phone_number: customer.phone || '',
        notice: customer.notice || '',
        tourId: tourId ||''
      
      });
      setErrors({});
    }
    // setAllCustomers(allCustomers);
    // console.log("all customers ----> ",allCustomers)
  }, [customer, open]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("field name -",field)
    console.log(formData)
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    console.log("Validating form data:", formData); // Debug log

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

    console.log("Validation errors:", e); // Debug log
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
        // console.log("=================================================================================")
        // console.log("Calculating distance between:", lat1, lon1, lat2, lon2);
        // console.log("=================================================================================")
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in KM
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

//  const handleSave = async () => {
//   if (!validate()) return;

//   let lat = null;
//   let lng = null;

//   if (hasAddressChanged()) {
//     try {
//       const locationResponse = await adminApiService.getLatLngFromAddress({
//         street: formData.street,
//         city: formData.city,
//         zipcode: formData.zipcode
//       });

//       if (
//         locationResponse?.data?.results?.[0]?.geometry?.lat &&
//         locationResponse?.data?.results?.[0]?.geometry?.lng
//       ) {
//         lat = locationResponse.data.results[0].geometry.lat;
//         lng = locationResponse.data.results[0].geometry.lng;
//         console.log("=================================================================================")
//         console.log("editing customer data", customer.lattitude, customer.longitude);
//         console.log("all customers data", allCustomers);
//         console.log("Fetched coordinates:", lat, lng);
//         console.log("=================================================================================")
//       } else {
//         setSnackbar({
//           open: true,
//           message: "Unable to fetch coordinates for the updated address.",
//           severity: 'error'
//         });
//         return;
//       }
//     } catch (err) {
//       console.error("Geocoding error:", err);
//       setSnackbar({
//         open: true,
//         message: "Error while fetching location coordinates.",
//         severity: 'error'
//       });
//       return;
//     }
//   }

//   const updatedData = {
//     order_id: customer.order_id,
//     street: formData.street,
//     city: formData.city,
//     zipcode: formData.zipcode,
//     phone: formData.phone_number,
//     notice: formData.notice,
//     tourId: formData.tourId,
//     ...(lat && lng && { latitude: lat, longitude: lng }) // Only include if fetched
//   };

//   try {
//     const response = await adminApiService.updateCustomerInfo(updatedData);

//     setSnackbar({
//       open: true,
//       message: "Customer info updated successfully",
//       severity: 'success'
//     });

//     if (onSave) {
//       const completeUpdatedCustomer = {
//         ...customer,
//         ...formData,
//         phone: formData.phone_number,
//         latitude: lat,
//         longitude: lng
//       };
//       onSave(completeUpdatedCustomer);
//     }

//     onClose();
//   } catch (error) {
//     console.error('Error updating customer:', error);
//     setSnackbar({ open: true, message: 'Failed to update customer info', severity: 'error' });
//   }
// };
const performUpdate = async (lat: number | null, lng: number | null) => {
  const updatedData = {
    order_id: customer.order_id,
    street: formData.street,
    city: formData.city,
    zipcode: formData.zipcode,
    phone: formData.phone_number,
    notice: formData.notice,
    tourId: formData.tourId,
    ...(lat && lng ? { latitude: lat, longitude: lng } : {})
  };
console.log("=================================================================================")
  console.log("Performing update with data:", updatedData);
  console.log("=================================================================================")
  try {
    await adminApiService.updateCustomerInfo(updatedData);

    setSnackbar({
      open: true,
      message: "Customer info updated successfully",
      severity: 'success'
    });

    if (onSave) {
      onSave({
        ...customer,
        ...formData,
        phone: formData.phone_number,
        latitude: lat,
        longitude: lng
      });
    }

    onClose();
  } catch (error) {
    console.error('Error updating customer:', error);
    setSnackbar({ open: true, message: 'Failed to update customer info', severity: 'error' });
  }
};
const handleSave = async () => {
  if (!validate()) return;

  let lat: number | null = null;
  let lng: number | null = null;

  if (hasAddressChanged()) {
    try {
      const locationResponse = await adminApiService.getLatLngFromAddress({
        street: formData.street,
        city: formData.city,
        zipcode: formData.zipcode
      });

      const result = locationResponse?.data?.results?.[0]?.geometry;

      if (result?.lat && result?.lng) {
        lat = result.lat;
        lng = result.lng;

        setNewLat(lat);
        setNewLng(lng);
        // Build confirmation data
        // console.log("=================================================================================")
        // console.log("all customers data", allCustomers);
        // console.log("=================================================================================")
        const data: ConfirmationRow[] = allCustomers.orders.map((cust:any) => {
        const distance = haversineDistance(cust.lattitude, cust.longitude, lat!, lng!);

          return {
            from: `${cust.order_id}${cust.order_id === customer.order_id ? ' (old location)' : ''}`,
            to: `Order ID: ${customer.order_id}`,
            distance: `${distance.toFixed(1)} km`,
            isEditedCustomer: cust.order_id === customer.order_id
          };
        });

        setConfirmationData(data);
        setConfirmationOpen(true); // Trigger confirmation modal
        return;
      } else {
        setSnackbar({
          open: true,
          message: "Unable to fetch coordinates for the updated address.",
          severity: 'error'
        });
        return;
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setSnackbar({
        open: true,
        message: "Error while fetching location coordinates.",
        severity: 'error'
      });
      return;
    }
  } else {
    // Proceed directly if no location change
    await performUpdate(customer.latitude, customer.longitude);
  }
};
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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

                  <TextField label="Last Name" value={customer.lastname} fullWidth disabled InputProps={{
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
                    }} />
                  <TextField label="Order Number" value={customer.order_number} fullWidth disabled InputProps={{
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
                    }} />
                  <CustomInput
                    label="Street"
                    value={formData.street}
                    onChange={handleChange('street')}
                    error={errors.street}
                  />
                  <CustomInput
                    label="City"
                    value={formData.city}
                    onChange={handleChange('city')}
                    error={errors.city}
                  />
                  <CustomInput
                    label="ZIP Code"
                    value={formData.zipcode}
                    onChange={handleChange('zipcode')}
                    error={errors.zipcode}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 5 }}
                  />
                  <CustomInput
                    label="Notice"
                    value={formData.notice}
                    onChange={handleChange('notice')}
                    error={errors.notice}
                  />
                  <CustomInput
                    label="Phone Number"
                    value={formData.phone_number}
                    onChange={handleChange('phone_number')}
                    error={errors.phone_number}
                    inputProps={{ inputMode: 'tel', maxLength: 15 }}
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

      <ConfirmationDialog
        open={confirmationOpen}
        data={confirmationData}
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={() => {
          setConfirmationOpen(false);
          performUpdate(newLat, newLng);
        }}
      />

    </>
  );
};

export default CustomerEditModal;
