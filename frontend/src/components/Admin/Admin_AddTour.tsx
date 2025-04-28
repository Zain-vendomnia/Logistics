import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import { AddRoad, LocalShipping } from '@mui/icons-material';
import AdminMultiselectCard from './Admin_MultiselectCard';
import AdminOrderTable from './Admin_OrderTable';
import CreateTourModal from './Admin_CreateTourModal';
import { LogisticOrder } from './AdminServices/latestOrderServices';

const Admin_AddTour = () => {
  const [selectedZipcodes, setSelectedZipcodes] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]); 
  const [ordersData, setOrdersData] = useState<LogisticOrder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'warning' | 'error'>('warning');

  const handleCreateTourClick = () => {
    if (selectedOrders.length === 0) {
      setAlertMessage('Please select orders before creating a tour.');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }
    
    const selectedOrdersData = ordersData.filter(order => 
      selectedOrders.includes(order.order_id)
    );
    
    const firstWarehouseId = selectedOrdersData[0]?.warehouse_id;
    const allSameWarehouse = selectedOrdersData.every(
      order => order.warehouse_id === firstWarehouseId
    );
    
    if (!allSameWarehouse) {
      setAlertMessage('All selected orders must be from the same warehouse.');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }
    
    setModalOpen(true);
  };

  return (
    <Box sx={{ padding: '24px', minHeight: 'calc(100vh - 50px)', backgroundColor:"#59555626", position: 'relative' }}>
      <Stack spacing={3} maxWidth="xl" margin="0 auto">
        {/* Multiselect Card Section */}
        <Paper elevation={0} sx={{ 
          padding: '24px', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <AdminMultiselectCard
            selectedZipcodes={selectedZipcodes}
            setSelectedZipcodes={setSelectedZipcodes}
          />
        </Paper>

        {/* Orders Section */}
        <Card elevation={0} sx={{ 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <CardContent>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              spacing={2}
              sx={{ marginBottom: '24px' }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShipping color="primary" fontSize="medium" />
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{ color: '#f7941d' }}
                >
                  Latest Orders
                </Typography>
              </Stack>
              
              <Button 
                variant="contained" 
                startIcon={<AddRoad />}
                onClick={handleCreateTourClick}
                disabled={selectedOrders.length === 0}
                sx={{
                  padding: '8px 24px',
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Create Tour
              </Button>
            </Stack>

            <Divider sx={{ marginBottom: '24px' }} />

            <AdminOrderTable
              selectedZipcodes={selectedZipcodes}
              setSelectedOrders={setSelectedOrders}
              setOrdersData={setOrdersData}
            />
          </CardContent>
        </Card>
      </Stack>

      {/* Create Tour Modal */}
      <CreateTourModal 
        open={modalOpen} 
        handleClose={() => setModalOpen(false)}  
        orderIds={selectedOrders} 
      />

      {/* Centered Alert Notification */}
      {alertOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1300,
            width: '300px',
          }}
        >
          <Alert 
            severity={alertSeverity}
            variant="filled"
            onClose={() => setAlertOpen(false)}
          >
            {alertMessage}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default Admin_AddTour;