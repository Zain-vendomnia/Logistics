import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
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
import { useNavigate } from 'react-router-dom';
import AdminShipmenttable from '../Admin/Admin_Shipmenttable';
import adminApiService from '../../services/adminApiService';
import './css/Admin_common.css';

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

// Styled Stat Card
const StatCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  width: '100%',
  maxWidth: '280px',
  minHeight: '160px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [errorCount, setErrorCount] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderCount = async () => {
      setLoadingCount(true);
      setErrorCount(null);
      try {
        const count = await adminApiService.getOrderCount();
        setOrderCount(count ?? 0);
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
      value: '1',
      label: 'Vehicles On Road',
      subLabel: 'Active vehicles currently tracking',
      route: '/vehicles-on-road',
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
      route: '/Admin_AddTour',
    },
    {
      icon: <Assessment fontSize="large" />,
      value: '92%',
      label: 'Delivery Status',
      subLabel: 'On-time delivery rate',
      route: '/delivery-status',
    },
    {
      icon: <BarChart fontSize="large" />,
      value: '87%',
      label: 'Fleet Efficiency',
      subLabel: 'Optimal route efficiency',
      route: '/fleet-efficiency',
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: '#fff', minHeight: 'calc(100vh - 50px)' }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={3}
          mb={4}
          sx={{justifyContent: 'space-around'}}
        >
          {stats.map((stat, idx) => (
            <StatCard key={idx} elevation={3} onClick={() => handleCardClick(stat.route)}>
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
          ))}
        </Stack>

        <AdminShipmenttable />
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;
