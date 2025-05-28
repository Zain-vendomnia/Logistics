import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton, Menu, MenuItem, TextField,
  Card, CardContent, CardHeader, Divider, Tooltip, Snackbar, Alert, Stack, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  MoreVert, Delete, FileDownload, Merge 
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import latestOrderServices, { TourInfo } from './AdminServices/latestOrderServices';
import { deleteTours } from './AdminServices/tourDeletionServices';
import { exportTours } from './AdminServices/tourExportServices';
import EditTourModal from './Admin_EditTourModal';
import '../Admin/css/Admin_TourTemplate.css';

interface Tour {
  id: string;
  tour_name: string;
  date: string;
  color: string;
  amount: number;
  timeRange: string;
  driver: string;
  tour_comments: string;
  driver_id?: number;
  warehouseId: number;
}

const ActionButton = ({ title, icon, color, onClick, disabled }: any) => (
  <Tooltip title={title}>
    <span>
      <Button variant="contained" color={color} startIcon={icon} size="small" onClick={onClick} disabled={disabled}>
        {title}
      </Button>
    </span>
  </Tooltip>
);

const AdminTourTemplates = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as any });

  const navigate = useNavigate();

  const showSnackbar = (message: string, severity: any) =>
    setSnackbar({ open: true, message, severity });

  const loadTours = useCallback(async () => {
    try {
      const instance = latestOrderServices.getInstance();
      const tourData = await instance.RealTimeToursData();
      setTours(tourData.map((t: TourInfo): Tour => ({
        id: t.id.toString(),
        tour_name: t.tour_name,
        tour_comments: t.tour_comments,
        date: new Date(t.tour_date).toLocaleDateString(),
        color: t.tour_route_color,
        amount: t.orders.length,
        timeRange: `${t.tour_startTime.slice(0, 5)} - ${t.tour_endTime.slice(0, 5)}`,
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
      headerName: 'Tour',
      flex: 1,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1} alignItems="center" height="100%">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
          <Box>
            <Typography fontWeight="bold">{row.tour_name} - {row.date}</Typography>
            <Typography variant="body2" color="text.secondary">{row.amount} orders · {row.timeRange}</Typography>
          </Box>
        </Box>
      )
    },
    { field: 'driver', headerName: 'Driver', flex: 1 },
    { field: 'timeRange', headerName: 'Period', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 200,
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
            <TextField
              placeholder="Search tours..."
              size="small"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 300 }}
            />
            <Box display="flex" gap={1}>
              <ActionButton title="Delete" icon={<Delete />} color="error" onClick={() => handleAction('delete')} disabled={!selected.length} />
              <ActionButton title="Merge" icon={<Merge />} color="secondary" onClick={() => handleAction('merge')} disabled={selected.length !== 2} />
              <ActionButton title="Export" icon={<FileDownload />} color="primary" onClick={() => handleAction('export')} disabled={!selected.length} />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <DataGrid
              rows={filteredTours}
              columns={columns}
              getRowId={(row) => row.id}
              checkboxSelection
              autoHeight
              disableRowSelectionOnClick
              onRowSelectionModelChange={(ids) => setSelected(ids as string[])}
              slots={{ toolbar: GridToolbar }}
              sx={{
                "& .MuiDataGrid-columnHeaderRow": {
                  backgroundColor: "#1976d2",
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: "bold",
                    color: "white"
                  }
                },
                "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#f9f9f9" },
                "& .MuiDataGrid-row:hover": { backgroundColor: "#e3f2fd !important" }
              }}
            />
          </Paper>

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setModalOpen(true); setAnchorEl(null); }}>Edit Tour</MenuItem>
            <Divider />
            <MenuItem
              sx={{ color: 'error.main' }}
              onClick={() => {
                if (currentTour) {
                  setAnchorEl(null);
                  handleDelete([currentTour.id]);
                }
              }}
            >
              Delete
            </MenuItem>
          </Menu>

          <EditTourModal
            open={modalOpen}
            handleClose={() => setModalOpen(false)}
            tourData={currentTour}
            onTourUpdated={() => {
              loadTours();
              showSnackbar('Tour updated', 'success');
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
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminTourTemplates;
