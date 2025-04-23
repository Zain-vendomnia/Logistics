import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  ChipProps,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

type Shipment = {
  id: string;
  company: string;
  arrivalDate: string; // format: 'MM-DD-YYYY'
  route: string;
  weight: string;
  status: string;
};

const Admin_Shipmenttable = () => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const tabs = ['All Shipments', 'Delivered', 'In transit', 'Processing', 'Pending'];

  const shipmentData: Shipment[] = [
    {
      id: 'ISJ957204',
      company: 'Nebula Nexus',
      arrivalDate: '11-22-2024',
      route: 'Boise, ID – Duluth, MN',
      weight: '12.5 kg',
      status: 'In transit',
    },
    {
      id: 'ISJ957203',
      company: 'Arizona Shipping',
      arrivalDate: '10-22-2024',
      route: 'Dallas, TX – Miami, FL',
      weight: '10.5 kg',
      status: 'Delivered',
    },
  ];

  const statusColors: Record<string, ChipProps['color']> = {
    Delivered: 'success',
    'In transit': 'info',
    Processing: 'warning',
    Pending: 'default',
  };

  // 🔍 Filter logic
  const filteredData = shipmentData.filter((row) => {
    const matchesTab = tab === 0 || row.status === tabs[tab];
    const matchesSearch =
      row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate
      ? dayjs(row.arrivalDate, 'MM-DD-YYYY').isSame(selectedDate, 'day')
      : true;

    return matchesTab && matchesSearch && matchesDate;
  });

  // Handle search term change and clear the date filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedDate(null); // Clear the date filter when search term changes
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Shipments Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Keep track of recent shipping activity
        </Typography>

        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
          {tabs.map((label, idx) => (
            <Tab key={idx} label={label} />
          ))}
        </Tabs>

        {/* Search and Date Filter Above the Table */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Order ID"
              value={searchTerm}
              onChange={handleSearchChange} // Call handleSearchChange on input change
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Date Picker */}
            <DatePicker
              label="Filter by Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
        )}

        {/* Table with Filtered Data */}
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Arrival Date</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.arrivalDate}</TableCell>
                    <TableCell>{row.route}</TableCell>
                    <TableCell>{row.weight}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={statusColors[row.status] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No shipments match your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
};

export default Admin_Shipmenttable;
