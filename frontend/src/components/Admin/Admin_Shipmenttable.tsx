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
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

type Shipment = {
  id: string;
  company: string;
  arrivalDate: string;
  route: string;
  weight: string;
  status: string;
};

const AdminShipmenttable: React.FC = () => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedDate(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          backgroundColor: '#fafafa', // light clean background
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', // soft shadow
        }}
      >
        {/* Header */}
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ color: 'primary.main' }} // updated orange tone
          gutterBottom
        >
          Shipments Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Monitor your logistics and recent shipment activity
        </Typography>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          {tabs.map((label, idx) => (
            <Tab
              key={idx}
              label={label}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: tab === idx ? 'primary.main' : 'text.secondary',
              }}
            />
          ))}
        </Tabs>

        {/* Search + Filter */}
        {tab === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search by Order ID or Company"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 48,
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
            />
            <DatePicker
              label="Filter by Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  height: 48,
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  variant: 'outlined',
                  fullWidth: true,
                },
              }}
            />
          </Box>
        )}

        <Divider sx={{ mb: 2, borderColor: '#e0e0e0' }} />

        {/* Table */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            backgroundColor: 'white',
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#fbe9e7', // soft orange light background
                }}
              >
                <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Arrival Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow hover key={index}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.arrivalDate}</TableCell>
                    <TableCell>{row.route}</TableCell>
                    <TableCell>{row.weight}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={statusColors[row.status] || 'default'}
                        variant="filled"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No shipments match your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </LocalizationProvider>
  );
};

export default AdminShipmenttable;
