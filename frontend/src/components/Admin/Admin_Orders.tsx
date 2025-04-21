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
import { symbolName } from 'typescript';
import { SwitchAccessShortcutOutlined } from '@mui/icons-material';
import '../Admin/css/Admin_OrderTable.css';

type Shipment = {
  id: string;
  company: string;
  arrivalDate: string; // format: 'MM-DD-YYYY'
  route: string;
  weight: string;
  status: string;
};

const Admin_Orders = () => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

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
  
  // Handle search term change and clear the date filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedDate(null); // Clear the date filter when search term changes
  };

 const handlePassSerach = (e:React.ChangeEvent<HTMLInputElement>)=>{
    setSearchTerm(e.target.validationMessage);
    setSearchTerm(e.currentTarget.ATTRIBUTE_NODE.toFixed.arguments);
    setSelectedDate(null);

 }
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Shipments Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Keep track of recent shipping activity
        </Typography>
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
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
};

export default Admin_Orders;
