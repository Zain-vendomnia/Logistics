import React from 'react';
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
import { useNavigate } from 'react-router-dom';  // Use useNavigate for navigation

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
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();  // Use useNavigate hook for navigation
  
  const stats = [
    { 
      icon: <DirectionsCar fontSize="large" />, 
      value: '24', 
      label: 'Vehicles On Road', 
      subLabel: 'Active vehicles currently tracking',
      route: '/vehicles-on-road'  // Path to navigate on click
    },
    { 
      icon: <LocalShipping fontSize="large" />, 
      value: '148', 
      label: 'Total Orders', 
      subLabel: 'Orders this month',
      route: '/total-orders'  // Path to navigate on click
    },
    { 
      icon: <Assessment fontSize="large" />, 
      value: '92%', 
      label: 'Delivery Status', 
      subLabel: 'On-time delivery rate',
      route: '/delivery-status'  // Path to navigate on click
    },
    { 
      icon: <BarChart fontSize="large" />, 
      value: '87%', 
      label: 'Fleet Efficiency', 
      subLabel: 'Optimal route efficiency',
      route: '/fleet-efficiency'  // Path to navigate on click
    },
  ];

  // Handle card click and navigate to the respective page
  const handleCardClick = (route: string) => {
    navigate(route);  // Navigate to the details page using useNavigate
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: '#59555626', minHeight: 'calc(100vh - 50px)' }}>
        {/* Header */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Dashboard Overview
        </Typography>

        {/* Stat Cards */}
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

        {/* Main Content */}
        <AdminShipmenttable />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;
