<<<<<<< HEAD
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
=======
import React, { useEffect, useState, useMemo } from "react";
import {
  Grid,
  CircularProgress,
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DriverPerformanceCard from "./DriverPerformanceCard";
import { getDriverPerformanceData } from "../../services/driverService";

interface Driver {
  id: number;
>>>>>>> recovered-admin-branch
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
<<<<<<< HEAD
  stats: DriverStats;
  rating: number;
  warehouseId: string;
  warehouseName: string;
=======
  rating: number;
  warehouseId: number;
  warehouseName: string;
  completedTours: number;

  // KPIs
  kpi1ImageUploadScore: number;
  kpi1ImageCount: number;
  kpi2DeliveryScore: number;
  totalExpectedDeliveries: number;
  totalActualDeliveries: number;
  undeliveredCount: number;
  kpi3PODScore: number;
  validPODs: number;
  kpi4KmEfficiencyScore: number;
  plannedKM: number;
  actualKM: number;
  kpi5TimeScore: number;
  totalPlannedTimeMinutes: number;
  totalActualTimeMinutes: number;
  kpi6FuelEfficiencyScore: number;
  expectedFuelLiters: number;
  actualFuelLiters: number;
  kpi7CustomerRating: number;
>>>>>>> recovered-admin-branch
}

const DriverPerformance = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
=======
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
>>>>>>> recovered-admin-branch

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    const fetchDriverPerformance = async () => {
      try {
        const response = await getDriverPerformanceData();
        setDrivers(response);
        console.log("Fetched driver performance data:", response);
      } catch (error) {
        console.error("Failed to fetch driver data:", error);
        console.log("error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverPerformance();
  }, []);

  const warehouseOptions = useMemo(() => {
    const map = new Map<number, string>();
    drivers.forEach((d) => map.set(d.warehouseId, d.warehouseName));
>>>>>>> recovered-admin-branch
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
<<<<<<< HEAD
    return drivers.filter(driver => {
=======
    return drivers.filter((driver) => {
>>>>>>> recovered-admin-branch
      const matchesSearch =
        driver.name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.mobile.includes(searchLower);

      const matchesWarehouse =
<<<<<<< HEAD
        selectedWarehouse === 'all' || driver.warehouseId === selectedWarehouse;
=======
        selectedWarehouse === "all" ||
        driver.warehouseId.toString() === selectedWarehouse;
>>>>>>> recovered-admin-branch

      return matchesSearch && matchesWarehouse;
    });
  }, [drivers, debouncedSearch, selectedWarehouse]);

  if (loading) {
    return (
<<<<<<< HEAD
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
=======
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
>>>>>>> recovered-admin-branch
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
<<<<<<< HEAD
        <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" mb={3}>
=======
        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          justifyContent="center"
          mb={3}
        >
>>>>>>> recovered-admin-branch
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
<<<<<<< HEAD
              sx: { height: '100%' },
=======
              sx: { height: "100%" },
>>>>>>> recovered-admin-branch
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
<<<<<<< HEAD
              '.MuiSelect-select': {
                height: 35,
                display: 'flex',
                alignItems: 'center',
=======
              ".MuiSelect-select": {
                height: 35,
                display: "flex",
                alignItems: "center",
>>>>>>> recovered-admin-branch
              },
            }}
          >
            <MenuItem value="all">All Warehouses</MenuItem>
            {warehouseOptions.map(({ id, name }) => (
<<<<<<< HEAD
              <MenuItem key={id} value={id}>{name}-{id}</MenuItem>
=======
              <MenuItem key={id} value={id.toString()}>
                {name} - {id}
              </MenuItem>
>>>>>>> recovered-admin-branch
            ))}
          </TextField>
        </Box>
      </Paper>

      {filteredDrivers.length === 0 ? (
<<<<<<< HEAD
        <Typography align="center" color="text.secondary">No drivers match the criteria.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredDrivers.map(driver => (
=======
        <Typography align="center" color="text.secondary">
          No drivers match the criteria.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredDrivers.map((driver) => (
>>>>>>> recovered-admin-branch
            <Grid item xs={12} sm={6} md={4} key={driver.id}>
              <DriverPerformanceCard
                name={driver.name}
                email={driver.email}
                mobile={driver.mobile}
                avatarUrl={driver.avatarUrl}
<<<<<<< HEAD
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
=======
                rating={driver.rating}
                warehouseId={driver.warehouseId.toString()}
                warehouseName={driver.warehouseName}
                completedTours={driver.completedTours}
                kpi1ImageUploadScore={driver.kpi1ImageUploadScore}
                kpi1ImageCount={driver.kpi1ImageCount}
                kpi2DeliveryScore={driver.kpi2DeliveryScore}
                totalExpectedDeliveries={driver.totalExpectedDeliveries}
                totalActualDeliveries={driver.totalActualDeliveries}
                undeliveredCount={driver.undeliveredCount}
                kpi3PODScore={driver.kpi3PODScore}
                validPODs={driver.validPODs}
                kpi4KmEfficiencyScore={driver.kpi4KmEfficiencyScore}
                plannedKM={driver.plannedKM}
                actualKM={driver.actualKM}
                kpi5TimeScore={driver.kpi5TimeScore}
                totalPlannedTimeMinutes={driver.totalPlannedTimeMinutes}
                totalActualTimeMinutes={driver.totalActualTimeMinutes}
                kpi6FuelEfficiencyScore={driver.kpi6FuelEfficiencyScore}
                expectedFuelLiters={driver.expectedFuelLiters}
                actualFuelLiters={driver.actualFuelLiters}
                kpi7CustomerRating={driver.kpi7CustomerRating}
                onViewDetail={() =>
                  console.log(`Viewing details for ${driver.name}`)
                }
>>>>>>> recovered-admin-branch
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DriverPerformance;
