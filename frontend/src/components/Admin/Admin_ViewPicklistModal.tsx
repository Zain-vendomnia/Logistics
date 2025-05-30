import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button, CircularProgress } from '@mui/material';
import adminApiService from '../../services/adminApiService';

import { generatePicklistEmailHtml} from '../../assets/templates/generatePicklistEmailHtml'; // Default Import
import { renderToStaticMarkup } from 'react-dom/server';
import latestOrderServices from './AdminServices/latestOrderServices';

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
  fontFamily: 'Raleway',
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

interface OrderItem {
  slmdl_articleordernumber: string;
  quantity: number;
}

interface Order {
  order_number: string;
  items: OrderItem[];
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
  const [picklistData, setPicklistData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [Btnloading, setBtnloading] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  useEffect(() => {
    if (!open || !tourData?.id) return;

    const fetchPicklistData = async (tourId: string) => {
      setLoading(true);
      try {
        const instance = latestOrderServices.getInstance();
        const toursdata = await instance.getTours();
        const matchedTour = toursdata.find((tour: any) => tour.id === Number(tourId));
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

    // Initial fetch immediately
    fetchPicklistData(tourData.id);

    // Setup interval for polling every 3 seconds
    const intervalId = setInterval(() => {
      fetchPicklistData(tourData.id);
    }, 3000);

    // Cleanup on unmount or when open/tourData changes
    return () => clearInterval(intervalId);

  }, [open, tourData]);


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

  // Helper: Merge logic
  const getMergedOrderItems = (orders: Order[]) => {
    const mergedMap = new Map<string, { order_number: string; slmdl_articleordernumber: string; quantity: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${order.order_number}-${item.slmdl_articleordernumber}`;
        if (mergedMap.has(key)) {
          mergedMap.get(key)!.quantity += item.quantity;
        } else {
          mergedMap.set(key, {
            order_number: order.order_number,
            slmdl_articleordernumber: item.slmdl_articleordernumber,
            quantity: item.quantity,
          });
        }
      });
    });

    return Array.from(mergedMap.values());
  };
  // Aggregate items by article number
  const aggregatedItems: { [key: string]: number } = {};
  let totalQuantity = 0;

  if (picklistData) {
    picklistData.orders.forEach((order: { items: any[]; }) => {
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
            <Box sx={{ textAlign: 'center', mb: '25px' }}>
              <img
                src={`https://sunniva-solar.de/wp-content/uploads/2025/01/Sunniva_1600x500_transparent-min.png`}
                alt="Sunniva Logo"
                style={{ height: '52px' }}
              />
            </Box>

            <Paper sx={{ p: 1, boxShadow: 'none' }}>
              {/* Title */}
              <Typography
                variant="h6"
                sx={{
                  textAlign: 'center',
                  color: '#000',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  mb: 2,
                  fontFamily: 'Raleway',
                }}
              >
                PICK LIST
              </Typography>

              {/* Warehouse & Driver Details */}
              <Box
                sx={{
                  fontFamily: 'Raleway',
                  color: '#000',
                  fontSize: '13px',
                  width: '430px',
                  lineHeight: 1.1,
                }}
              >
                <p>
                  <strong>Location&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {picklistData?.warehouseName ?? 'N/A'} <br />
                  <strong>Driver&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {picklistData?.driver?.driver_name ?? 'N/A'} <br />
                  <strong>Licence plate&nbsp;&nbsp;&nbsp;:</strong> {picklistData?.driver?.licenceplate ?? 'N/A'} <br />
                  <strong>Email&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {picklistData?.driver?.email ?? 'N/A'} <br />
                  <strong>Phone&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> {picklistData?.driver?.mobile ?? 'N/A'} <br />
                  <strong>ZIP Code&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> 
                  {(() => {
                    const uniqueZips = picklistData?.orders
                      ?.map((order: { zipcode: string }) => order.zipcode)
                      .filter((zip: string, index: number, self: string[]) => zip && self.indexOf(zip) === index);

                    if (!uniqueZips || uniqueZips.length === 0) return ' N/A';

                    return uniqueZips.length === 1
                      ? ` ${uniqueZips[0]}`
                      : ` ${uniqueZips.map((zip: string) => zip.slice(-2)).join(', ')}`;
                  })()} <br />
                  <strong>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong>
                  {picklistData?.tour_date
                    ? (() => {
                        const dates = picklistData.tour_date.split(',');
                        return dates
                          .map((day: string, index: number) =>
                            index === 0
                              ? ` ${new Date(day).toLocaleDateString('en-GB')}`
                              : `\n                     ${new Date(day).toLocaleDateString('en-GB')}`
                          )
                          .join('\n');
                      })()
                    : ' N/A'}
                </p>
              </Box>
            </Paper>


            {/*<Typography variant="h6" mb={2} sx={{ color: '#ef972e' }}>Order item details</Typography>*/}

            {/* Orders Table */}
      {/*      <TableContainer component={Paper}>
              <Table>
                <TableHead  sx={{ background: 'linear-gradient(45deg, #f7941d 30%, #f37021 90%)'}}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>ITEM</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>QUANTITY</strong></TableCell>
                    <TableCell align="center" sx={{ color: 'white' }}><strong>ORDER NO</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getMergedOrderItems(picklistData.orders).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell align="center">{item.slmdl_articleordernumber}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">{item.order_number}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>*/}

            {/* Aggregated Table */}
            {/*<Typography variant="h6" mb={2} mt={3} sx={{ color: '#ef972e' }}>Total pickup items</Typography>*/}
            <TableContainer
              component={Paper}
              sx={{
                width: '89%',
                marginLeft: '11%',
                boxShadow: 'none', // Remove Paper shadow
                fontFamily: 'Raleway, sans-serif',
                borderRadius: '0px'
              }}
            >
              <Table
                sx={{
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f79c22' }}>
                    <TableCell
                      align="center"
                      sx={{
                        border: '1.5px solid #000',
                        padding: '14px 20px 2px',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      ITEM
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        border: '1.5px solid #000',
                        padding: '14px 20px 2px',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      QUANTITY
                    </TableCell> 
                    <TableCell
                      align="center"
                      sx={{
                        border: '1.5px solid #000',
                        padding: '14px 20px 2px',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      CHECK
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(aggregatedItems).map(([articleNumber, qty], index) => (
                    <TableRow key={index}>
                      <TableCell
                        align="center"
                        sx={{
                          border: '1.5px solid #000',
                          padding: '29px 8px',
                          fontFamily: 'Raleway, sans-serif',
                        }}
                      >
                        {articleNumber}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          border: '1.5px solid #000',
                          padding: '29px 8px',
                          fontFamily: 'Raleway, sans-serif',
                        }}
                      >
                        {qty}
                      </TableCell> 
                      <TableCell
                        align="center"
                        sx={{
                          border: '1.5px solid #000',
                          padding: '29px 8px',
                          fontFamily: 'Raleway, sans-serif',
                        }}
                      >

                      </TableCell>
                    </TableRow>
                  ))}
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
