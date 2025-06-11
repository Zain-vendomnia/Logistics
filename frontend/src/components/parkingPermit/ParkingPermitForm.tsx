import React, { useRef, useState, useEffect } from 'react';
import { Box, Grid, Typography, TextField, MenuItem, Button, Checkbox, FormControlLabel, Snackbar, Alert } from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import SignatureCanvas from 'react-signature-canvas';
import { useLocation } from 'react-router-dom'; // Import useLocation
import latestOrderServices from '../Admin/AdminServices/latestOrderServices';
import axios from 'axios'; // If using axios for API calls
import './ParkingPermitForm.css'; // Import CSS
import adminApiService from '../../services/adminApiService';
import { getParkingPermitEmailHTML } from '../../assets/templates/ParkingPermitEmailTemplate';
import ThankYouModal from './ThankYouModal';

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
  const encodedOrderNumber = queryParams.get('o');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const [codeVerified, setCodeVerified] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);

  const showSnackbar = (message: string, severity: any) =>
    setSnackbar({ open: true, message, severity });


  const [errors, setErrors] = useState({
    firstName:        false,
    lastName:         false,
    street:           false,
    postalCode:       false,
    city:             false,
    orderNumber:      false,
    parkingLocation:  false,
    email:            false,
    verificationCode: false,
    signature:        false,
    termsAgreed:      false,
    privacyAgreed:    false,
  });


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
  // console.log(decodedOrderNumber)
  // console.log(typeof decodedOrderNumber)
  const fetchPicklistData = async (orderId: string) => {

    try {

     if (orderId) {

       const instance = latestOrderServices.getInstance();
       const orders = await instance.getOrder(decodedOrderNumber);

       const orderData = orders.find((order: any) => order.order_number === orderId);
      //  const orderData = orders.find((order: any) => order.order_number === orderId);

       if (orderData) {

         setFormData({
           ...formData,
           orderNumber:orderData.order_number,
           firstName:  orderData.firstname,
           lastName:   orderData.lastname,
           street:     orderData.street,
           postalCode: orderData.zipcode,
           city:       orderData.city,
           email:      orderData.email,
         });
       }
     }
    } catch (error) {
      console.error('Error fetching order data:', error);
    } 
  };


  useEffect(() => {
    if (decodedOrderNumber) {
      fetchPicklistData(decodedOrderNumber);
    }
  }, [decodedOrderNumber]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Automatically check verification code
    if (name === 'verificationCode') {
      setCodeVerified(value === generatedCode);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };
const handleSubmit = async () => {
  // ❗ Make sure signatureData is always a string (never undefined)
  const signatureData =
    sigPad.current && !sigPad.current.isEmpty()
      ? sigPad.current.toDataURL('image/png')
      : ""; // <-- default to "" if sigPad.current is undefined or empty

  // Build the error‐flags object
  const newErrors = {
    firstName:        !formData.firstName?.trim(),
    lastName:         !formData.lastName?.trim(),
    street:           !formData.street?.trim(),
    postalCode:       !formData.postalCode?.trim(),
    city:             !formData.city?.trim(),
    orderNumber:      !formData.orderNumber?.trim(),
    parkingLocation:  !formData.parkingLocation?.trim(),
    email:            !formData.email?.trim(),
    verificationCode: !codeVerified,
    signature:        !signatureData,        // will be true if signatureData === ""
    termsAgreed:      !formData.termsAgreed,
    privacyAgreed:    !formData.privacyAgreed,
  };

  setErrors(newErrors);

  // Stop submission if any field is invalid
  if (Object.values(newErrors).some((flag) => flag)) {
    showSnackbar("Bitte füllen Sie alle Pflichtfelder aus.", "error");
    return;
  }

  try {
    // 1) Save to backend
    await adminApiService.insertParkingPermit({
      orderNumber: formData.orderNumber!,
      customer_signature: signatureData,
      parkingLocation: formData.parkingLocation!,
    });

    // 2) Prepare and send “customer” email
    const greetingText = `
      <p>Lieber ${formData.firstName} ${formData.lastName},</p>
      <p>Die Parkberechtigung wurde erfolgreich übermittelt.</p>
      <p>Ihr Auftrag wird wie gewünscht ausgeführt.</p>
    `;
    const subject = `Formular zur Abgabegenehmigung - Bestellnummer #${decodedOrderNumber}`;

    // ‼️ We assert formData.email! because we know it’s nonempty (we validated above)
    handleEmail(formData.email!, formData, signatureData, greetingText, subject);

    // 3) Prepare and send “customer care” email
    const CCText = `
      <p><strong>Dear Customer Care,</strong></p>
      <p>You have received a new Drop Off Permission Form submission. Below are the details submitted by the user:</p>
    `;
    const CCsubject = `Drop Off Permission Form - Order ID ${decodedOrderNumber}`;

    handleEmail(
      "jishi.puthanpurayil@vendomnia.com",
      formData,
      signatureData,
      CCText,
      CCsubject
    );

    // 4) Show thank‐you and reset form
    setThankYouOpen(true);
    setFormData({
      salutation:        "",
      firstName:         "",
      lastName:          "",
      street:            "",
      postalCode:        "",
      city:              "",
      orderNumber:       "",
      parkingLocation:   "",
      email:             "",
      verificationCode:  "",
      termsAgreed:       false,
      privacyAgreed:     false,
    });
    setCodeVerified(false);
    setGeneratedCode("");
    setCodeSent(false);
    sigPad.current?.clear();
  } catch (error) {
    console.error("insertParkingPermit error:", error);
    showSnackbar("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.", "error");
  }
};

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: true }));
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    setGeneratedCode(code);
    setCodeSent(true);

    const OTPEmail = 'Sehr geehrte Kundin, sehr geehrter Kunde, Ihr OTP für die Einreichung des Parkausweisformulars lautet: '+code+'. Bitte verwenden Sie diesen Code, um Ihre Einreichung abzuschließen.';

    await adminApiService.picklistEmail({
      to: formData.email, // Update with actual email
      subject: 'Parking Permit - OTP',
      html: OTPEmail,
    });

  };
  
const handleEmail = async (
  to: string,
  formData: any,
  signatureData: string,
  greetingText: string,
  subject: string
) => {
  try {
    // Build the HTML with “Ja”/“NEIN” for the checkboxes
    const html = getParkingPermitEmailHTML(
      {
        ...formData,
        termsAgreed:  formData.termsAgreed   ? "Ja" : "NEIN",
        privacyAgreed: formData.privacyAgreed ? "Ja" : "NEIN",
      },
      signatureData,
      greetingText
    );

    await adminApiService.picklistEmail({
      to,
      subject,
      html,
      signatureData,
    });

    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Email sending failed:", err);
  }
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
            required
            value={formData.firstName}
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.firstName}
            helperText={errors.firstName ? '* Vorname ist erforderlich' : ''}
          />

        </Grid>

        <Grid item xs={12} sm={4.5}>
          <TextField
            fullWidth
            label="Nachname"
            name="lastName"
            required
            value={formData.lastName}
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.lastName}
            helperText={errors.lastName ? '* Nachname ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Straße"
            name="street"
            required
            value={formData.street}
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.street}
            helperText={errors.street ? '* Straße ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Postleitzahl"
            name="postalCode"
            value={formData.postalCode}
            required
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.postalCode}
            helperText={errors.postalCode ? '* Postleitzahl ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Stadt"
            name="city"
            value={formData.city}
            required
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.city}
            helperText={errors.city ? '* Stadt ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Bestellnummer"
            name="orderNumber"
            value={formData.orderNumber}
            required
            InputProps={{ readOnly: true }}
            onChange={handleChange}
            error={errors.orderNumber}
            helperText={errors.orderNumber ? '* Bestellnummer ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Abstellort"
            name="parkingLocation"
            value={formData.parkingLocation}
            required
            onChange={handleChange}
            error={errors.parkingLocation}
            helperText={errors.parkingLocation ? '* Abstellort ist erforderlich' : ''}
          />
        </Grid>

        <Grid item xs={4}>
          <TextField
            fullWidth
            label="eMail Adresse"
            name="email"
            value={formData.email}
            required
            onChange={handleChange}
            error={errors.email}
            helperText={errors.email ? '* eMail Adresse ist erforderlich' : ''}
          />
          <Button
            variant="contained"
            className="confirm-button email-confirm"
            onClick={handleSendVerificationCode}
            disabled={codeSent}
          >
            {codeSent ? 'Code Gesendet' : 'Klicken Sie hier, um Ihre E-Mail zu bestätigen'}
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
            {errors.signature && (
              <Typography color="error" variant="caption" className="signature-req">
                * Unterschrift ist erforderlich
              </Typography>
            )}
            <Button onClick={() => sigPad.current?.clear()} size="small" className="clear-signature-button">
              Klare Signatur
            </Button>
          </Box>
        </Grid>

        <Grid item xs={2} sm={5}>
          <Box className="submit-container"  sx={{ textAlign: 'left' }}>
          <TextField
            // fullWidth
            label="Verifizierungscode"
            name="verificationCode"
            value={formData.verificationCode}
            onChange={handleChange}
            error={errors.verificationCode}
            helperText={
              errors.verificationCode ? 'Ungültiger Verifizierungscode' : codeVerified ? 'Code erfolgreich verifiziert.' : ''
            }
          />
          
            <Typography variant="caption" className="error-caption">
              <br/>
              * Geben Sie Ihre E-Mail-Adresse ein und klicken Sie auf Bestätigen, um den Bestätigungscode zu erhalten.
            </Typography>
          </Box>
          <Box className="submit-container agree-checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  name="termsAgreed"
                  required
                  checked={formData.termsAgreed}
                  onChange={handleCheckboxChange}
                />
              }

              label={
                  <span>
                    Ich stimme den{' '}
                    <a
                      href="https://sunniva-solar.de/terms-of-the-parking-permit/" // Replace with your actual privacy URL
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#ef972e', textDecoration: 'underline' }}
                    >
                      Bedingungen der Abstellgenehmigung
                    </a>{' '}
                    zu.
                  </span>
                }
            />
            {errors.termsAgreed && (
              <Typography color="error" variant="caption">
              <br/>
                * Allgemeine Geschäftsbedingungen ist erforderlich
              </Typography>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  name="privacyAgreed"
                  required
                  checked={formData.privacyAgreed}
                  onChange={handleCheckboxChange}
                />
              }
              label={
                  <span>
                    Ich stimme der{' '}
                    <a
                      href="https://sunniva-solar.de/privacy-policy/" // Replace with your actual privacy URL
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#ef972e', textDecoration: 'underline' }}
                    >
                      Datenschutzerklärung
                    </a>{' '}
                    zu.
                  </span>
                }
            />
            {errors.privacyAgreed && (
              <Typography color="error" variant="caption">
                <br/>
                * Datenschutzerklärung ist erforderlich
              </Typography>
            )}
          </Box>

          <Box className="submit-container">
            <Button variant="contained" onClick={handleSubmit} className="submit-button">
              EINREICHEN
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <ThankYouModal isOpen={thankYouOpen} onClose={() => setThankYouOpen(false)} />

    </Box>

  );
};

export default DeliveryPermitForm;
