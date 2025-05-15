import React, { useRef, useState, useEffect } from 'react';
import { Box, Grid, Typography, TextField, MenuItem, Button, Checkbox, FormControlLabel } from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import SignatureCanvas from 'react-signature-canvas';
import { useLocation } from 'react-router-dom'; // Import useLocation
import axios from 'axios'; // If using axios for API calls

import './ParkingPermitForm.css'; // Import CSS

const salutations = ['Herr', 'Frau', 'Divers', 'Firma'];

interface SignatureCanvasRef {
  getTrimmedCanvas: () => HTMLCanvasElement;
  toDataURL: (type?: string) => string;
  clear: () => void;
}

const DeliveryPermitForm = () => {
  const sigPad = useRef<SignatureCanvas & SignatureCanvasRef | null>(null);
  const [formData, setFormData] = useState({
    salutation: '',
    firstName: '',
    lastName: '',
    street: '',
    postalCode: '',
    city: '',
    orderNumber: '',
    parkingLocation: '',
    email: '',
    verificationCode: '',
    termsAgreed: false,
    privacyAgreed: false,
  });

  // Step 1: Get the base64 encoded order number from the URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const encodedOrderNumber = queryParams.get('orderNumber');

  // Step 2: Decode the base64 order number (with URL encoding handling)
  const decodeBase64 = (encodedString: string | null) => {
    if (encodedString) {
      try {

        // Step 1: Handle URL-safe base64 encoding by replacing URL-safe characters
        let decodedUrlString = encodedString.replace(/-/g, '+').replace(/_/g, '/');

        const padding = decodedUrlString.length % 4;
        if (padding) {
          decodedUrlString += '='.repeat(4 - padding); // Add necessary padding
        }
        // Step 2: Decode the base64 string
        return atob(decodedUrlString);
      } catch (error) {
        console.error('Error decoding base64 string:', error);
        return ''; // Return an empty string if there's an error
      }
    }

    return ''; // Return an empty string if input is null or undefined
  };



  const decodedOrderNumber = decodeBase64(encodedOrderNumber);

  // Step 3: Fetch order data from the API
  useEffect(() => {
    if (decodedOrderNumber) {
      axios
        .get('http://localhost:8080/api/admin/routeoptimize/getAlltours')
        .then((response) => {
          const tours = response.data;
          const orderData = tours
            .flatMap((tour: any) => tour.orders)
            .find((order: any) => order.order_number === decodedOrderNumber);

          if (orderData) {
            // Step 4: Pre-fill the form with the fetched data
            setFormData({
              ...formData,
              orderNumber: orderData.order_number,
              firstName: orderData.firstname,
              lastName: orderData.lastname,
              street: orderData.street,
              postalCode: orderData.zipcode,
              city: orderData.city,
              email: orderData.email,
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching order data:', error);
        });
    }
  }, [decodedOrderNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = () => {
    console.log(sigPad);
    const signature = sigPad.current?.toDataURL('image/png');
    console.log({ ...formData, signature });
  };

  return (
    <Box className="delivery-container">
      <Typography variant="h4" className="delivery-title">
        Abgabegenehmigung
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            label="Anrede"
            name="salutation"
            value={formData.salutation}
            onChange={handleChange}
          >
            {salutations.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4.5}>
          <TextField
            fullWidth
            label="Vorname"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={4.5}>
          <TextField
            fullWidth
            label="Nachname"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Straße"
            name="street"
            value={formData.street}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Postleitzahl"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Stadt"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Bestellnummer"
            name="orderNumber"
            value={formData.orderNumber}
            onChange={handleChange}
            disabled
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Abstellort"
            name="parkingLocation"
            value={formData.parkingLocation}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={4}>
          <TextField
            fullWidth
            label="eMail Adresse"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Button variant="contained" className="confirm-button email-confirm">
            Klicken Sie hier, um Ihre E-Mail zu bestätigen
          </Button>
        </Grid>

        <Grid item xs={10} sm={7}>
          <Box className="signature-box">
            <Typography variant="subtitle2" className="signature-title">
              Unterschrift des Empfängers/Vollmachtgebers oder einer dazu berechtigten Person
            </Typography>
            <SignaturePad
              ref={sigPad}
              canvasProps={{
                className: 'signature-canvas',
                height: 250,
              }}
            />
            <Button onClick={() => sigPad.current?.clear()} size="small" className="clear-signature-button">
              Klare Signatur
            </Button>
          </Box>
        </Grid>

        <Grid item xs={2} sm={5}>
          <Box className="submit-container">
            <TextField
              fullWidth
              label="Verifizierungscode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleChange}
            />
            <Typography variant="caption" className="error-caption">
              * Geben Sie Ihre E-Mail-Adresse ein und klicken Sie auf Bestätigen, um den Bestätigungscode zu erhalten.
            </Typography>
          </Box>
          <Box className="submit-container agree-checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleCheckboxChange}
                />
              }
              label="Ich stimme den Bedingungen der Abstellgenehmigung zu."
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="privacyAgreed"
                  checked={formData.privacyAgreed}
                  onChange={handleCheckboxChange}
                />
              }
              label="Ich stimme der Datenschutzerklärung zu."
            />
          </Box>

          <Box className="submit-container">
            <Button variant="contained" onClick={handleSubmit} className="submit-button">
              EINREICHEN
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeliveryPermitForm;
