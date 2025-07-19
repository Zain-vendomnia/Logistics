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
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
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
}

const DriverPerformance = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
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
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.mobile.includes(searchLower);

      const matchesWarehouse =
        selectedWarehouse === "all" ||
        driver.warehouseId.toString() === selectedWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [drivers, debouncedSearch, selectedWarehouse]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
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
        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          justifyContent="center"
          mb={3}
        >
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
              sx: { height: "100%" },
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
              ".MuiSelect-select": {
                height: 35,
                display: "flex",
                alignItems: "center",
              },
            }}
          >
            <MenuItem value="all">All Warehouses</MenuItem>
            {warehouseOptions.map(({ id, name }) => (
              <MenuItem key={id} value={id.toString()}>
                {name} - {id}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {filteredDrivers.length === 0 ? (
        <Typography align="center" color="text.secondary">
          No drivers match the criteria.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredDrivers.map((driver) => (
            <Grid item xs={12} sm={6} md={4} key={driver.id}>
              <DriverPerformanceCard
                name={driver.name}
                email={driver.email}
                mobile={driver.mobile}
                avatarUrl={driver.avatarUrl}
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
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DriverPerformance;
