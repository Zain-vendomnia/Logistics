import React, { useEffect, useState, useMemo } from 'react';
import {
  Grid, CircularProgress, Box, Typography, TextField,
  InputAdornment, MenuItem, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DriverPerformanceCard from './DriverPerformanceCard';
import {getDriverPerformanceData } from '../../services/driverService'; // Adjust the import path as necessary
interface DriverStats {
  total: number;
  completed: number;
  pending: number;
  totalHours: number;
  earlyCompletions: number;
  delayedCompletions: number;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  stats: DriverStats;
  rating: number;
  warehouseId: string;
  warehouseName: string;
}

const DriverPerformance = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
  const fetchDriverPerformance = async () => {
    try {
      const response = await getDriverPerformanceData(); // This should return Driver[]
      setDrivers(response);
      console.log('Fetched driver performance data:', response);
    } catch (error) {
      console.error('Failed to fetch driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchDriverPerformance();
}, []);
  // useEffect(() => {
  //   const fetchDriverPerformance = async () => {
  //     try {
  //       const response = await new Promise<Driver[]>(resolve =>
  //         setTimeout(() =>
  //           resolve([
  //             {
  //               id: '1',
  //               name: 'Alice Johnson',
  //               email: 'alice@example.com',
  //               mobile: '1234567890',
  //               stats: {
  //                 total: 40,
  //                 completed: 35,
  //                 pending: 5,
  //                 totalHours: 160,
  //                 earlyCompletions: 10,
  //                 delayedCompletions: 2,
  //               },
  //               rating: 4.6,
  //               warehouseId: 'w123',
  //               warehouseName: 'North Logistics Hub',
  //             },
  //             {
  //               id: '2',
  //               name: 'Bob Smith',
  //               email: 'bob@example.com',
  //               mobile: '9876543210',
  //               stats: {
  //                 total: 30,
  //                 completed: 28,
  //                 pending: 2,
  //                 totalHours: 135,
  //                 earlyCompletions: 6,
  //                 delayedCompletions: 1,
  //               },
  //               rating: 4.3,
  //               warehouseId: 'w456',
  //               warehouseName: 'South Depot',
  //             },
  //             {
  //               id: '3',
  //               name: 'Charlie Brown',
  //               email: 'charlie@example.com',
  //               mobile: '5555555555',
  //               stats: {
  //                 total: 50,
  //                 completed: 45,
  //                 pending: 5,
  //                 totalHours: 200,
  //                 earlyCompletions: 12,
  //                 delayedCompletions: 3,
  //               },
  //               rating: 4.5,
  //               warehouseId: 'w123',
  //               warehouseName: 'North Logistics Hub',
  //             },
  //             {
  //               id: '4',
  //               name: 'David Wilson',
  //               email: 'david@example.com',
  //               mobile: '4444444444',
  //               stats: {
  //                 total: 60,
  //                 completed: 55,
  //                 pending: 5,
  //                 totalHours: 245,
  //                 earlyCompletions: 15,
  //                 delayedCompletions: 5,
  //               },
  //               rating: 4.7,
  //               warehouseId: 'w456',
  //               warehouseName: 'South Depot',
  //             },
  //           ]),
  //           1000
  //         )
  //       );
  //       setDrivers(response);
  //     } catch (error) {
  //       console.error('Failed to fetch driver data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDriverPerformance();
  // }, []);

  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>();
    drivers.forEach(d => map.set(d.warehouseId, d.warehouseName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return drivers.filter(driver => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.mobile.includes(searchLower);

      const matchesWarehouse =
        selectedWarehouse === 'all' || driver.warehouseId === selectedWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [drivers, debouncedSearch, selectedWarehouse]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box padding={2}>
      <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
        Driver Performance Dashboard
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" mb={3}>
          <TextField
            label="Search by name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { height: '100%' },
            }}
            sx={{ minWidth: 280 }}
          />
          <TextField
            select
            label="Filter by warehouse"
            size="medium"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            sx={{
              minWidth: 220,
              '.MuiSelect-select': {
                height: 35,
                display: 'flex',
                alignItems: 'center',
              },
            }}
          >
            <MenuItem value="all">All Warehouses</MenuItem>
            {warehouseOptions.map(({ id, name }) => (
              <MenuItem key={id} value={id}>{name}-{id}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {filteredDrivers.length === 0 ? (
        <Typography align="center" color="text.secondary">No drivers match the criteria.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredDrivers.map(driver => (
            <Grid item xs={12} sm={6} md={4} key={driver.id}>
              <DriverPerformanceCard
                name={driver.name}
                email={driver.email}
                mobile={driver.mobile}
                avatarUrl={driver.avatarUrl}
                stats={driver.stats}
                rating={driver.rating}
                warehouseId={driver.warehouseId}
                warehouseName={driver.warehouseName}
                totalHours={driver.stats.totalHours}
                earlyCompletions={driver.stats.earlyCompletions}
                delayedCompletions={driver.stats.delayedCompletions}
                onViewDetail={() => {
                  console.log(`Viewing details for ${driver.name}`);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DriverPerformance;
