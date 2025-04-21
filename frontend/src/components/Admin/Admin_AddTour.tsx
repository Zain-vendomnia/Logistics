import React, { useState } from 'react';
import { Box, Button, CardContent, Typography, Snackbar, Alert } from '@mui/material';
import Card from './Card';
import Admin_MultiselectCard from './Admin_MultiselectCard';
import Admin_OrderTable from './Admin_OrderTable';
import CreateTourModal from './Admin_CreateTourModal';
import './css/Admin_OrderTable.css';
import latestOrderServices from './AdminServices/latestOrderServices'; 

const Admin_AddTour = () => {
  const [selectedZipcodes, setSelectedZipcodes] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]); // Store selected orders
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCreateTourClick = () => {
    
    if (selectedOrders.length === 0) { // Check if no orders are selected
      setSnackbarOpen(true); // Show warning if no orders are selected
      return;
    }
    setModalOpen(true); // Open modal if orders are selected
  };

  return (
    <div className="dashboard">
      <Admin_MultiselectCard
        selectedZipcodes={selectedZipcodes}
        setSelectedZipcodes={setSelectedZipcodes}
      />
      <Card title={""} description={""} bgColor={""}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Latest Orders</Typography>
            <Button variant="contained" color="primary" onClick={handleCreateTourClick}>
              Create Tour
            </Button>
            <CreateTourModal open={modalOpen} handleClose={() => setModalOpen(false)}  orderIds = {selectedOrders} />
          </Box>
          <Admin_OrderTable
            selectedZipcodes={selectedZipcodes}
            setSelectedOrders={setSelectedOrders} // Pass selectedOrders updater function
          />
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: '100%' }}>
          Please select orders before creating a tour.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Admin_AddTour;
