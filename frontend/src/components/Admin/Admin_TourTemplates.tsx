import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Card, CardContent, CardHeader,
  Divider, Tooltip, Snackbar, Alert,Stack, Button, IconButton, Menu, MenuItem, Chip, Modal, Fade, Backdrop 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { MoreVert, Delete, FileDownload, Merge, Email } from '@mui/icons-material';
import latestOrderServices, { TourInfo } from './AdminServices/latestOrderServices';
import { deleteTours } from './AdminServices/tourDeletionServices';
import { exportTours } from './AdminServices/tourExportServices';
import EditTourModal from './Admin_EditTourModal';
import ViewPicklistModal from './Admin_ViewPicklistModal';
import '../Admin/css/Admin_TourTemplate.css';
import adminApiService from '../../services/adminApiService';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getOrderInitialEmailHTML } from '../../assets/templates/OrderInitialEmails';

import { sendSMS, sendWhatsAppMessage, sendEmail, EmailTemplate } from '../../services/notificationService';
import { handlePermit } from '../../utils/handleHelper';

interface Tour {
  id: string;
  tour_name: string;
  date: string;
  color: string;
  amount: number;
  timeRange: string;
  driver: string;
  tour_status: string;
  tour_comments: string;
  driver_id?: number;
  warehouseId: number;
}

const AdminTourTemplates = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const [viewPicklistModalOpen, setViewPicklistModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [permitTourIds, setPermitTourIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showSnackbar = (message: string, severity: any) =>
    setSnackbar({ open: true, message, severity });

  const loadTours = useCallback(async () => {
    try {
      const instance = latestOrderServices.getInstance();
      const statusData = await instance.getTourStatusHistory();
      const tourData = [...statusData.confirmed, ...statusData.pending];
      setTours(tourData.map((t: TourInfo): Tour => ({
        id: t.id.toString(),
        tour_name: t.tour_name,
        tour_comments: t.tour_comments,
        tour_status: t.tour_status,
        date: new Date(t.tour_date).toLocaleDateString(),
        color: t.tour_route_color,
        amount: t.orders.length,
        timeRange: `${t.tour_startTime.slice(0, 5)}`,
        driver: t.driver?.driver_name || 'N/A',
        warehouseId: t.warehouseId,
        driver_id: t.driver?.driver_id || 0
      })));
    } catch (e) {
      console.error(e);
      showSnackbar('Failed to load tours', 'error');
    }
  }, []);

  useEffect(() => {
    loadTours();
    const interval = setInterval(() => {
        loadTours(); // fetch tours every 30 seconds
      }, 3000); // 30,000 ms = 30 seconds
  return () => clearInterval(interval); // clean up on unmount

  }, [loadTours]); // loadTours is stable now


  const filteredTours = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tours.filter(t => [t.tour_name, t.driver, t.date, t.timeRange, t.id].some(f => f.toLowerCase().includes(term)));
  }, [tours, searchTerm]);

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteTours(ids);
      await loadTours();
      setSelected(s => s.filter(id => !ids.includes(id)));
      showSnackbar(`Deleted ${ids.length} tour(s)`, 'success');
    } catch {
      showSnackbar('Failed to delete tours', 'error');
    }
  };
  
  const triggerPermitEmail = async () => {
    setLoading(true);

    try{
      // Send Logistics Email to Customer
      handlePermit(permitTourIds);

      showSnackbar('Emails sent successfully', 'success');
    } catch (error) {
      console.error('Error sending emails:', error);
      showSnackbar('Failed to send emails', 'error');
    } finally {
      // Close the modal after sending the emails
      setLoading(false);
      setConfirmOpen(false);
      setPermitTourIds([]);
    }
  };

  // Function to handle the permit email sending process
  // const handlePermit = async () => {
  //   setLoading(true);

  //   const instance = latestOrderServices.getInstance();
  //   const toursdata = await instance.getTours();
  //   const idNumbers = permitTourIds.map(id => Number(id));  // Get the IDs of selected tours
  //   const matchedTours = toursdata.filter((tour: any) => idNumbers.includes(tour.id)); // Filter the tours based on the selected IDs
  //   const allOrders = matchedTours.flatMap((tour: any) => tour.orders);  // Extract all orders from matched tours

  //   try {
  //     // Send an email to each order's customer
  //     for (const order of allOrders) {

  //       const orderNumber = order.order_number;

  //       // Use window.location.origin or env var
  //       const baseUrl = `${window.location.protocol}//${window.location.host}/ParkingPermitForm`;

  //       const encodedOrderNumber = btoa(orderNumber); // Or use Buffer.from if needed

  //       const finalUrl = `${baseUrl}?o=${encodedOrderNumber}`;

  //       const trackingCode = order.tracking_code;

  //       let html = '';
  //       let condition = 0;

  //      const formattedTime = formatDeliveryWindow(order.order_time);
  //       order.order_time = formattedTime;


  //       if (trackingCode && order.order_status_id != 10006 ) {

  //         condition = 1;

  //       }else if( !trackingCode && order.order_status_id != 10006 ){
  //        condition = 2;

  //       }else if(order.order_status_id == 10006){
  //        condition = 3;
  //       }


  //       html = getOrderInitialEmailHTML(
  //           order,
  //           finalUrl,
  //           condition
  //       );
  //       console.log('condition: ',condition);

  //         // const html = `Dear ${order.firstname} ${order.lastname},\n \n 
  //         // Please use the following form and return it to us completed and signed.
  //         // Fill out the parking permit:\n
  //         // ${finalUrl} \n \n
  //         // Once submitted, we will automatically receive your permission and arrange delivery accordingly.`;

  //       await adminApiService.sendEmail({
  //         // to: order.email,
  //         to: 'muhammad.jahanzaibbaloch@vendomnia.com',
  //         subject: 'Parking Permit - Order #'+orderNumber,
  //         html
  //       });
  //     }
  //     showSnackbar('Emails sent successfully', 'success');
  //   } catch (error) {
  //     console.error('Error sending emails:', error);
  //     showSnackbar('Failed to send emails', 'error');
  //   } finally {
  //     // Close the modal after sending the emails
  //     setLoading(false);
  //     setConfirmOpen(false);
  //     setPermitTourIds([]);
  //   }
  // };

  const handleOnlyParkingPermit= async () => {
    // setLoading(true);
    const instance = latestOrderServices.getInstance();
    const toursdata = await instance.getTours();
    const idNumbers = permitTourIds.map(id => Number(id));  // Get the IDs of selected tours
    const matchedTours = toursdata.filter((tour: any) => idNumbers.includes(tour.id)); // Filter the tours based on the selected IDs
    const allOrders = matchedTours.flatMap((tour: any) => tour.orders);  // Extract all orders from matched tours
    SingleOrderParkingPermit(allOrders[0]);
  };
  // Function to handle the send specific order parking permit email process
  const SingleOrderParkingPermit = async (order: any) => {
      // setLoading(true);
      try {
        // Send an email to each order's customer
        const orderNumber = order.order_number;

        // Use window.location.origin or env var
        const baseUrl = `${window.location.protocol}//${window.location.host}/ParkingPermitForm`;

        const encodedOrderNumber = btoa(orderNumber); // Or use Buffer.from if needed

        const finalUrl = `${baseUrl}?o=${encodedOrderNumber}`;


        let html = '';
        let condition = 4;

       const formattedTime = formatDeliveryWindow(order.order_time);
        order.order_time = formattedTime;



        html = getOrderInitialEmailHTML(
            order,
            finalUrl,
            condition
        );

          // const html = `Dear ${order.firstname} ${order.lastname},\n \n 
          // Please use the following form and return it to us completed and signed.
          // Fill out the parking permit:\n
          // ${finalUrl} \n \n
          // Once submitted, we will automatically receive your permission and arrange delivery accordingly.`;

        await adminApiService.sendEmail({
          // to: order.email,
          to: 'muhammad.jahanzaibbaloch@vendomnia.com',
          subject: 'Parking Permit - Order #'+orderNumber,
          html
        });

      showSnackbar('Emails sent successfully', 'success');
    } catch (error) {
      console.error('Error sending emails:', error);
      showSnackbar('Failed to send emails', 'error');
    } finally {
      // Close the modal after sending the emails
      setLoading(false);
      // setConfirmOpen(false);
      setPermitTourIds([]);
    }
  };

  const formatDeliveryWindow = (isoString: string): string => {
    const startDate = new Date(isoString);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes

    // Format date
    const day = String(startDate.getUTCDate()).padStart(2, '0');
    const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
    const year = startDate.getUTCFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Format time helper
    const formatTime = (date: Date): string => {
      let hours = date.getUTCHours();
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const startTime = formatTime(startDate);
    const endTime = formatTime(endDate);

    return  `${formattedDate} (${startTime}) zwischen ${endTime}`;
  };



  const handleSendEmail = async () => {
    try {
        const data: EmailTemplate = {
              to: "muhammad.jahanzaibbaloch@vendomnia.com", 
              subject: "Order Arrival", 
              templateName: 'customer-notification', 
              templateData: { name: 'Jahanzaib Baloch' }
            }
      const response = await sendEmail(data);
      alert(`Email Sent: ${response}`);
    } catch (error) {
      alert(`Failed to send email : ${error}`);
    }
  };
  const handleSendSMS = async () => {
    try {
      const response = await sendSMS('+18777804236', 'customer-notification', { name: 'Jahanzaib Baloch' });
      alert(`SMS Sent: ${response}`);
    } catch (error) {
      alert('Failed to send SMS');
    }
  };
  const handleSendWhatsApp = async () => {
    try {
      const response = await sendWhatsAppMessage('+971551246787', 'customer-notification', { name: 'Nagaraj' });
      alert(`WhatsApp Sent: ${response}`);
    } catch (error) {
      alert('Failed to send WhatsApp message');
    }
  };

  const handleAction = async (action: 'delete' | 'merge' | 'export'|'permit') => {
    if (!selected.length) return showSnackbar('No tours selected', 'warning');
    try {

      if (action === 'permit'){
            setPermitTourIds(selected); 

            setConfirmOpen(true);
      }
      if (action === 'delete') return handleDelete(selected);
      if (action === 'merge')
        return selected.length === 2
          ? showSnackbar('Merge not implemented', 'info')
          : showSnackbar('Select 2 tours to merge', 'warning');
      if (action === 'export') {
        await exportTours(selected);
        showSnackbar(`Exported ${selected.length} tour(s)`, 'success');
      }
    } catch {
      showSnackbar(`${action} failed`, 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'tour_name',
      headerName: 'Name',
      flex: 2,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1} alignItems="center" height="100%">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
          <Box>
            <Typography fontWeight="bold">{row.tour_name}</Typography>
            <Typography variant="body2" color="text.secondary">{row.amount} orders · {row.timeRange}</Typography>
          </Box>
        </Box>
      )
    },
    { field: 'driver', headerName: 'Driver', flex: 1 },
    { field: 'timeRange', headerName: 'Start Time', flex: 1 },
   {
  field: 'tour_status',
  headerName: 'Status',
  flex: 1,
  renderCell: ({ value }) => {
    let chipColor;
    if (value === 'confirmed') {
      chipColor = '#2e7d32'; // green
    } else if (value === 'pending') {
      chipColor = '#d32f2f'; // red
    } else {
      chipColor = '#1976d2'; // blue (primary)
    }

    return (
      <Chip
        label={value}
        variant="filled"
        sx={{
          fontWeight: 500,
          bgcolor: `${chipColor}`,
          color: "white",
        }}
      />
    );
  }
},
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1.5,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" height="100%">
          <Button
            variant="outlined"
            onClick={() => navigate(`/Admin_TourMapView/${row.id}`)}
            size='small'
            sx={(theme) => ({
              padding: '8px 24px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: '500',
              background: theme.palette.primary.gradient,
              color: "#fff",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "#fff",
                color: theme.palette.primary.dark,
              }
            })}
          >
            View Map
          </Button>
          <IconButton onClick={e => { setAnchorEl(e.currentTarget); setCurrentTour(row); }}>
            <MoreVert />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box p={3}>
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardHeader title="Tour Overview" sx={{ bgcolor: '#1976d2', color: 'white' }} />
        <CardContent>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
            <TextField placeholder="Search tours..." size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ maxWidth: 300 }} />
            <Box display="flex" gap={1}>
                 <Tooltip title="Send Parking Permit">
                <span>
                  <Button variant="contained" color="success" startIcon={<Email/>} onClick={() => handleAction('permit')} disabled={!selected.length}>Send Parking Permit</Button>
                </span>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleAction('delete')} disabled={!selected.length}>Delete</Button>
                </span>
              </Tooltip>
              <Tooltip title="Merge">
                <span>
                  <Button variant="contained" color="secondary" startIcon={<Merge />} onClick={() => handleAction('merge')} disabled={selected.length !== 2}>Merge</Button>
                </span>
              </Tooltip>
              <Tooltip title="Export">
                <span>
                  <Button variant="contained" color="primary" startIcon={<FileDownload />} onClick={() => handleAction('export')} disabled={!selected.length}>Export</Button>
                </span>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <DataGrid
            rows={filteredTours}
            columns={columns}
            checkboxSelection
            rowHeight={75}
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => setSelected(ids as string[])}
            rowSelectionModel={selected}
            getRowId={(row) => row.id}
          />

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setModalOpen(true); setAnchorEl(null); }}>Edit Tour</MenuItem>
              <Divider />
            <MenuItem onClick={() => { setViewPicklistModalOpen(true); setAnchorEl(null); }}>View Picklist</MenuItem>
              <Divider />
                <MenuItem onClick={() => {
              if (currentTour) {
                setPermitTourIds([currentTour.id]);
                setConfirmOpen(true);
                setAnchorEl(null);
              }
            }}>Send Parking Permit</MenuItem>
             <Divider />
            <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (currentTour) { handleDelete([currentTour.id]);  } setAnchorEl(null); }}>Delete</MenuItem>
             <Divider />
             <Button className="notification-button"  onClick={handleSendEmail}>Send Email</Button>             
             <Divider />
             <Button className="notification-button"  onClick={handleSendSMS}>Send Sms</Button>          
             <Divider />
             <Button className="notification-button"  onClick={handleSendWhatsApp}>Send Whatsapp</Button>
             <Divider />
             <Button color="primary" disabled={loading} onClick={() => {
              if (currentTour) {
                setPermitTourIds([currentTour.id]);
                setAnchorEl(null);
                handleOnlyParkingPermit();
              }
            }}>{loading ? 'Sending...' : 'Single Permit'}</Button>
          </Menu>

          <EditTourModal
            open={modalOpen}
            handleClose={() => setModalOpen(false)}
            tourData={currentTour}
            onTourUpdated={() => { loadTours(); showSnackbar('Tour updated', 'success'); }}
          />
          
          <ViewPicklistModal
            open={viewPicklistModalOpen}
            handleClose={() => setViewPicklistModalOpen(false)}
            tourData={currentTour}
            onSendEmail={(success) => {
              if (success) {
                showSnackbar('Email Sent Successfully!', 'success');
                setViewPicklistModalOpen(false);
              } else {
                showSnackbar('Error sending email!', 'error');
              }
            }}
          />


          
        </CardContent>
      </Card>
        
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={confirmOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              minWidth: 300,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 70, color: '#ef972e' }} />
            <Typography variant="h5" mt={2} mb={1}>
              Are you sure you want to send the parking permits?
            </Typography>
            <Typography variant="body1">This action cannot be undone.</Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={3}>
              <Button variant="contained" color="secondary"  onClick={() => setConfirmOpen(false)}>No</Button>
              <Button variant="contained" color="primary" disabled={loading} onClick={triggerPermitEmail}>{loading ? 'Sending...' : 'Yes'}</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

    </Box>

  );
};

export default AdminTourTemplates;