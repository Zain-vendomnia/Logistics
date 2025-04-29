import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  styled,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import {
  DirectionsCar,
  LocalShipping,
  Assessment,
  BarChart,
} from '@mui/icons-material';
import AdminShipmenttable from '../Admin/Admin_Shipmenttable';
import { useNavigate } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';
// Custom Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#f7941d',
      contrastText: '#fff',
    },
    secondary: {
      main: '#2a9d8f',
    },
    background: {
      default: '#f9f9f9',
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h5: {
      fontWeight: 700,
    },
  },
});

// Styled Components
const StatCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // state for order count
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [errorCount, setErrorCount] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderCount = async () => {
      setLoadingCount(true);
      setErrorCount(null);
  
      try {
        const count = await adminApiService.getOrderCount(); 
        setOrderCount(count);
      } catch (err) {
        setErrorCount('Error');
      } finally {
        setLoadingCount(false);
      }
    };
  
    loadOrderCount();
  }, []);

  const stats = [
    { 
      icon: <DirectionsCar fontSize="large" />, 
      value: '24', 
      label: 'Vehicles On Road', 
      subLabel: 'Active vehicles currently tracking',
      route: '/vehicles-on-road'
    },
    { 
      icon: <LocalShipping fontSize="large" />, 
      value: loadingCount
        ? '…'
        : errorCount
        ? errorCount
        : orderCount?.toString() ?? '0',
      label: 'Total Orders', 
      subLabel: 'Orders from Shopware',
      route: '/Admin_AddTour'
    },
    { 
      icon: <Assessment fontSize="large" />, 
      value: '92%', 
      label: 'Delivery Status', 
      subLabel: 'On-time delivery rate',
      route: '/delivery-status'
    },
    { 
      icon: <BarChart fontSize="large" />, 
      value: '87%', 
      label: 'Fleet Efficiency', 
      subLabel: 'Optimal route efficiency',
      route: '/fleet-efficiency'
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: '#59555626', minHeight: 'calc(100vh - 50px)' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <StatCard elevation={3} onClick={() => handleCardClick(stat.route)}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h5" sx={{ color: 'primary.main' }}>
                  {stat.value}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.subLabel}
                </Typography>
              </StatCard>
            </Grid>
          ))}
        </Grid>

        <AdminShipmenttable />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;
