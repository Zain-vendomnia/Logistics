import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button, CircularProgress } from '@mui/material';
import adminApiService from '../../services/adminApiService';
import { generatePicklistEmailHtml} from '../../assets/templates/generatePicklistEmailHtml'; // Default Import
import { renderToStaticMarkup } from 'react-dom/server';



const modalStyle = {
  overflow: 'auto',
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  // width: '600px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
  height:'90vh',
};


// Email Signature HTML
const emailSignatureHtml = `
  <div class="rd-mail-signature" style="font-family:Helvetica,Arial,Calibri,Sans-Serif;font-size:12px;margin:0;padding:0">
    <table class="rd-top-info" style="font-size:12px;border-spacing:0;">
      <tbody>
        <tr>
          <td>--</td>
        </tr>
        <tr>
          <td style="font-size:12px;line-height:10px;padding-bottom:5px">Mit freundlichen Grüßen / Best Regards</td>
        </tr>
      </tbody>
    </table>
    <table class="rd-top-info" style="font-size:12px;border-spacing:0;">
      <tbody>
        <tr>
          <td style="font-size:12px;line-height:10px;padding-bottom:5px;"><span class="rd-name" style="font-size:12px;font-weight:700;padding-bottom:5px;border-bottom: 2px solid #f69328;"></span></td>
        </tr>
      </tbody>
    </table>

    <table style="font-size:12px;border-spacing:0">
      <tbody>
        <tr>
          <td><span class="rd-mail"><img src="https://vendomnia.com/media/image/71/fb/86/envelope_gr.png"><a href="mailto:service@vendomnia.com"> service@vendomnia.com</a></span></td>
        </tr>
        <tr>
          <td><span class="rd-mail"><img src="https://vendomnia.com/media/image/71/fb/86/envelope_gr.png"><a href="mailto:service@sunniva-solar.de"> service@sunniva-solar.de</a></span></td>
        </tr>
        <tr>
          <td><img src="https://vendomnia.com/media/image/73/69/be/web_gr.png"><a href="https://www.vendomnia.com"> www.vendomnia.com</a></td>
        </tr>
        <tr>
          <td><img src="https://vendomnia.com/media/image/73/69/be/web_gr.png"><a href="www.sunniva-solar.de"> www.sunniva-solar.de</a></td>
        </tr>
      </tbody>
    </table>
    <br>
    <br>
    <img src="https://vendomnia.com/media/image/c2/56/da/sunniva_logo.png" alt="Sunniva GmbH">
    <br><br>
    
    <table style="font-size:12px;border-spacing:0">
      <tbody>
        <tr>
          <td style="font-weight:600;">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NYZMr0zl4BJs1uV6wY5e_10bQFWLOAsKAceTqqPJhmtct11GRnjm4s8dzR-Fv1E6h0wMauk7zpp72PBCmpRJtKuJgGWaWQMrA=s0-d-e1-ft#https://www.vendomnia.rs/images/ger_flag_small.png"> Sunniva GmbH
          </td>
        </tr>
        <tr>
          <td> Honer Straße 49</td>
        </tr>
        <tr>
          <td> 37269 Eschwege</td>
        </tr>
        <tr>
          <td> Germany</td>
        </tr>
      </tbody>
    </table>
    <br><br>
    <table style="font-size:12px;border-spacing:0;border-bottom: 2px solid #f69328;">
      <tbody>
        <tr>
          <td>VAT Identification Number: DE328448044</td>
        </tr>
        <tr>
          <td>Commercial Register Number: HRB 206120</td>
        </tr>
        <tr>
          <td>Amtsgericht Göttingen</td>
        </tr>
        <tr>
          <td>VerpackG Register Nummer: DE1381538064420</td>
        </tr>
        <tr>
          <td>ElektroG WEEE Register Nummer: DE53396155</td>
        </tr>
        <tr>
          <td>BATTG Register Nummer: DE62881384</td>
        </tr>
      </tbody>
    </table>
  </div>
`;

export interface Item {
  slmdl_articleordernumber: string;
  quantity: number;
}

export interface Order {
  order_number: string;
  items: Item[];
}

export interface Driver {
  address: string;
  driver_id: number;
  driver_name: string;
  mobile: string;
}

export interface PicklistData {
  driver: Driver;
  orders: Order[];
}



interface ViewPicklistModalProps {
  open: boolean;
  handleClose: () => void;
  tourData: any;
  onSendEmail: (success: boolean) => void; // <-- updated here
}

const ViewPicklistModal: React.FC<ViewPicklistModalProps> = ({ open, handleClose, tourData, onSendEmail }) => {
  const [picklistData, setPicklistData] = useState<PicklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [Btnloading, setBtnloading] = useState(false);


  useEffect(() => {
    if (open && tourData?.id) {
      fetchPicklistData(tourData.id);
    }
  }, [open, tourData]);

  const fetchPicklistData = async (tourId: string) => {
    setLoading(true);

    try {
      const response = await adminApiService.fetchAllTours(); // Assuming this fetches all the tours

      // Filter the tour by matching `id` with `tourData.id`
      const matchedTour = response.data.find((tour: any) => tour.id === parseInt(tourId)); // If `tourId` is a string, you might need to parse it
      if (matchedTour) {
        setPicklistData(matchedTour);
      } else {
        console.error('Tour not found');
      }
    } catch (error) {
      console.error('Error fetching picklist data:', error);
    } finally {
      setLoading(false);
    }

  };

  const handleSendEmail = async () => {
    if (!picklistData) return;

    const emailHtml = generatePicklistEmailHtml(picklistData, aggregatedItems, totalQuantity);
    const fullEmailHtml = emailHtml + emailSignatureHtml;
    setBtnloading(true);
    
    try {
      await adminApiService.picklistEmail({
        to: 'jishi.puthanpurayil@vendomnia.com', // Update with actual email
        subject: 'Picklist',
        html: fullEmailHtml,
      });

      // On success
      onSendEmail(true);

     } catch (error) {
       // On error
      onSendEmail(false);

       console.error('Failed to send email', error);

     } finally {
      setBtnloading(false);
    }
  };
  // Aggregate items by article number
  const aggregatedItems: { [key: string]: number } = {};
  let totalQuantity = 0;

  if (picklistData) {
    picklistData.orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.slmdl_articleordernumber;
        aggregatedItems[key] = (aggregatedItems[key] || 0) + item.quantity;
        totalQuantity += item.quantity;
      });
    });
  }

  if (loading) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>Loading picklist...</Typography>
        </Box>
      </Modal>
    );
  }

  if (!picklistData) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>No picklist data available.</Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box>
        <Grid container spacing={2}>
          <Box sx={modalStyle}>
            <Typography variant="h6" mb={2} sx={{ color: '#ef972e' }}>PICKLIST</Typography>

            {/* Static Info */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Location:</strong> ESCHWEGE
                    <br />
                    <strong>Driver:</strong> {picklistData?.driver?.driver_name}
                    <br />
                    <strong>Licence Plate:</strong> ESW-SN600
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Email:</strong> yousef.alomar@vendomnia.com
                    <br />
                    <strong>Phone:</strong> {picklistData?.driver?.mobile}
                    <br />
                    <strong>ZIP Code:</strong> 30-31
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Date:</strong>
                    <br />
                    Montag - 05.05.2025 - Tag 1
                    <br />
                    Dienstag - 06.05.2025 - Tag 2
                  </Typography>
                </Grid>
              </Grid>
            </Paper>


            <Typography variant="h6" mb={2} sx={{ color: '#ef972e' }}>Order item details</Typography>

            {/* Orders Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f3ab2d' }}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>ITEM</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>QUANTITY</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>ORDER NO</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {picklistData.orders.map((order, orderIndex) =>
                    order.items.map((item, itemIndex) => (
                      <TableRow key={`${orderIndex}-${itemIndex}`}>
                        <TableCell align="center">{item.slmdl_articleordernumber}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="center">{order.order_number}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Aggregated Table */}
            <Typography variant="h6" mb={2} mt={3} sx={{ color: '#ef972e' }}>Total pickup items</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f3ab2d' }}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>TOTAL ITEM</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>TOTAL QUANTITY</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(aggregatedItems).map(([articleNumber, qty], index) => (
                    <TableRow key={index}>
                      <TableCell align="center">{articleNumber}</TableCell>
                      <TableCell align="center">{qty}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} align="right">
                      <strong>Total Solar Panels: {totalQuantity}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Email Button */}
            <Box mt={3} textAlign="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendEmail}
              disabled={Btnloading}
              startIcon={Btnloading && <CircularProgress size={20} color="inherit" />}
            >
              {Btnloading ? 'Sending...' : 'Send Email'}
            </Button>

            </Box>
          </Box>
        </Grid>
      </Box>
    </Modal>
  );


};

export default ViewPicklistModal;
