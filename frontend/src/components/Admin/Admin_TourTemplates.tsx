import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Card, CardContent, CardHeader,
  Divider, Tooltip, Snackbar, Alert,Stack, Button, IconButton, Menu, MenuItem, Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { MoreVert, Delete, FileDownload, Merge } from '@mui/icons-material';
import latestOrderServices, { TourInfo } from './AdminServices/latestOrderServices';
import { deleteTours } from './AdminServices/tourDeletionServices';
import { exportTours } from './AdminServices/tourExportServices';
import EditTourModal from './Admin_EditTourModal';
import ViewPicklistModal from './Admin_ViewPicklistModal';
import '../Admin/css/Admin_TourTemplate.css';

interface Tour {
  id: string;
  tour_name: string;
  date: string;
  color: string;
  amount: number;
  timeRange: string;
  driver: string;
  tour_status: string;
  tour_comments: string;
  driver_id?: number;
  warehouseId: number;
}

const AdminTourTemplates = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });
  const [viewPicklistModalOpen, setViewPicklistModalOpen] = useState(false);
  const navigate = useNavigate();

  const showSnackbar = (message: string, severity: any) =>
    setSnackbar({ open: true, message, severity });

  const loadTours = useCallback(async () => {
    try {
      const instance = latestOrderServices.getInstance();
      const statusData = await instance.getTourStatusHistory();
      const tourData = [...statusData.confirmed, ...statusData.pending];
      setTours(tourData.map((t: TourInfo): Tour => ({
        id: t.id.toString(),
        tour_name: t.tour_name,
        tour_comments: t.tour_comments,
        tour_status: t.tour_status,
        date: new Date(t.tour_date).toLocaleDateString(),
        color: t.tour_route_color,
        amount: t.orders.length,
        timeRange: `${t.tour_startTime.slice(0, 5)}`,
        driver: t.driver?.driver_name || 'N/A',
        warehouseId: t.warehouseId,
        driver_id: t.driver?.driver_id || 0
      })));
    } catch (e) {
      console.error(e);
      showSnackbar('Failed to load tours', 'error');
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const filteredTours = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tours.filter(t => [t.tour_name, t.driver, t.date, t.timeRange, t.id].some(f => f.toLowerCase().includes(term)));
  }, [tours, searchTerm]);

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteTours(ids);
      await loadTours();
      setSelected(s => s.filter(id => !ids.includes(id)));
      showSnackbar(`Deleted ${ids.length} tour(s)`, 'success');
    } catch {
      showSnackbar('Failed to delete tours', 'error');
    }
  };

  const handleAction = async (action: 'delete' | 'merge' | 'export') => {
    if (!selected.length) return showSnackbar('No tours selected', 'warning');
    try {
      if (action === 'delete') return handleDelete(selected);
      if (action === 'merge')
        return selected.length === 2
          ? showSnackbar('Merge not implemented', 'info')
          : showSnackbar('Select 2 tours to merge', 'warning');
      if (action === 'export') {
        await exportTours(selected);
        showSnackbar(`Exported ${selected.length} tour(s)`, 'success');
      }
    } catch {
      showSnackbar(`${action} failed`, 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'tour_name',
      headerName: 'Name',
      flex: 2,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
          <Box>
            <Typography fontWeight="bold">{row.tour_name}</Typography>
            <Typography variant="body2" color="text.secondary">{row.amount} orders · {row.timeRange}</Typography>
          </Box>
        </Box>
      )
    },
    { field: 'driver', headerName: 'Driver', flex: 1 },
    { field: 'timeRange', headerName: 'Start Time', flex: 1 },
   {
  field: 'tour_status',
  headerName: 'Status',
  flex: 1,
  renderCell: ({ value }) => {
    let chipColor;
    if (value === 'confirmed') {
      chipColor = '#2e7d32'; // green
    } else if (value === 'pending') {
      chipColor = '#d32f2f'; // red
    } else {
      chipColor = '#1976d2'; // blue (primary)
    }

    return (
      <Chip
        label={value}
        variant="filled"
        sx={{
          fontWeight: 500,
          bgcolor: `${chipColor}`,
          color: "white",
        }}
      />
    );
  }
},
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1.5,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" height="100%">
          <Button
            variant="outlined"
            onClick={() => navigate(`/Admin_TourMapView/${row.id}`)}
            size='small'
            sx={(theme) => ({
              padding: '8px 24px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: '500',
              background: theme.palette.primary.gradient,
              color: "#fff",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "#fff",
                color: theme.palette.primary.dark,
              }
            })}
          >
            View Map
          </Button>
          <IconButton onClick={e => { setAnchorEl(e.currentTarget); setCurrentTour(row); }}>
            <MoreVert />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box p={3}>
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardHeader title="Tour Overview" sx={{ bgcolor: '#1976d2', color: 'white' }} />
        <CardContent>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
            <TextField placeholder="Search tours..." size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ maxWidth: 300 }} />
            <Box display="flex" gap={1}>
              <Tooltip title="Delete">
                <span>
                  <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleAction('delete')} disabled={!selected.length}>Delete</Button>
                </span>
              </Tooltip>
              <Tooltip title="Merge">
                <span>
                  <Button variant="contained" color="secondary" startIcon={<Merge />} onClick={() => handleAction('merge')} disabled={selected.length !== 2}>Merge</Button>
                </span>
              </Tooltip>
              <Tooltip title="Export">
                <span>
                  <Button variant="contained" color="primary" startIcon={<FileDownload />} onClick={() => handleAction('export')} disabled={!selected.length}>Export</Button>
                </span>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <DataGrid
            rows={filteredTours}
            columns={columns}
            checkboxSelection
            autoHeight
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => setSelected(ids as string[])}
            rowSelectionModel={selected}
            getRowId={(row) => row.id}
          />

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setModalOpen(true); setAnchorEl(null); }}>Edit Tour</MenuItem>
              <Divider />
            <MenuItem onClick={() => { setViewPicklistModalOpen(true); setAnchorEl(null); }}>View Picklist</MenuItem>
              <Divider />
            <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (currentTour) { handleDelete([currentTour.id]);  } setAnchorEl(null); }}>Delete</MenuItem>
          </Menu>

          <EditTourModal
            open={modalOpen}
            handleClose={() => setModalOpen(false)}
            tourData={currentTour}
            onTourUpdated={() => { loadTours(); showSnackbar('Tour updated', 'success'); }}
          />

          <ViewPicklistModal
            open={viewPicklistModalOpen}
            handleClose={() => setViewPicklistModalOpen(false)}
            tourData={currentTour}
            onSendEmail={(success) => {
              if (success) {
                showSnackbar('Email Sent Successfully!', 'success');
                setViewPicklistModalOpen(false);
              } else {
                showSnackbar('Error sending email!', 'error');
              }
            }}
          />
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminTourTemplates;