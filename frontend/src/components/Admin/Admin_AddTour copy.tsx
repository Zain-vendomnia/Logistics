import React, { useState } from 'react';
import { Box, Button, CardContent, Typography, Snackbar, Alert } from '@mui/material';
import Card from './Card';
import Admin_MultiselectCard from './Admin_MultiselectCard';
import Admin_OrderTable from './Admin_OrderTable';
import CreateTourModal from './Admin_CreateTourModal';
import './css/Admin_OrderTable.css';
import { LogisticOrder } from './AdminServices/latestOrderServices';

const Admin_AddTour = () => {
  const [selectedZipcodes, setSelectedZipcodes] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [ordersData, setOrdersData] = useState<LogisticOrder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'warning' | 'error'>('warning');

  const handleCreateTourClick = () => {
    if (selectedOrders.length === 0) {
      setSnackbarMessage('Please select orders before creating a tour.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    // Get the selected orders' data
    const selectedOrdersData = ordersData.filter(order => 
      selectedOrders.includes(order.order_id)
    );
    
    // Check if all selected orders have the same warehouse_id
    const firstWarehouseId = selectedOrdersData[0]?.warehouse_id;
    const allSameWarehouse = selectedOrdersData.every(
      order => order.warehouse_id === firstWarehouseId
    );
    
    if (!allSameWarehouse) {
      setSnackbarMessage('All selected orders must be from the same warehouse.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    setModalOpen(true);
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
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateTourClick}
              disabled={selectedOrders.length === 0}
            >
              Create Tour
            </Button>
            <CreateTourModal 
              open={modalOpen} 
              handleClose={() => setModalOpen(false)}  
              orderIds={selectedOrders} 
            />
          </Box>
          <Admin_OrderTable
            selectedZipcodes={selectedZipcodes}
            setSelectedOrders={setSelectedOrders}
            setOrdersData={setOrdersData}
          />
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Admin_AddTour;