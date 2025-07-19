import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Checkbox,
  Button, IconButton, Menu, MenuItem, TextField, Card, CardContent, CardHeader,
  Divider, Tooltip, Snackbar, Alert
} from '@mui/material';
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

const LiveTours = () => {
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

  // useCallback ensures loadTours is stable, and prevents infinite rerendering.
  const loadTours = useCallback(async () => {
    try {
      const instance = latestOrderServices.getInstance();
      const statusData = await instance.getTourStatusHistory();
      const liveTours = statusData.live; 
      setTours(liveTours.map((t: TourInfo): Tour => ({
        id: t.id.toString(),
        tour_name: t.tour_name,
        tour_comments: t.tour_comments,
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
    const interval = setInterval(() => {
    loadTours(); // fetch tours every 30 seconds
    }, 3000); // 30,00 ms = 3 seconds
  return () => clearInterval(interval);
  }, [loadTours]); // loadTours is stable now

  const filteredTours = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tours.filter(t => [t.tour_name, t.driver, t.date, t.timeRange, t.id].some(f => f.toLowerCase().includes(term)));
  }, [tours, searchTerm]);

  const handleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);

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

  return (
    <Box p={3}>
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardHeader title="Tour Overview" sx={{ bgcolor: '#1976d2', color: 'white' }} />
        <CardContent>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
            <TextField placeholder="Search tours..." size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ maxWidth: 300 }} />
            <Box display="flex" gap={1}>
              <ActionButton title="Delete" icon={<Delete />} color="error" onClick={() => handleAction('delete')} disabled={!selected.length} />
              <ActionButton title="Merge" icon={<Merge />} color="secondary" onClick={() => handleAction('merge')} disabled={selected.length !== 2} />
              <ActionButton title="Export" icon={<FileDownload />} color="primary" onClick={() => handleAction('export')} disabled={!selected.length} />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredTours.length}
                    checked={filteredTours.length > 0 && selected.length === filteredTours.length}
                    onChange={e => setSelected(e.target.checked ? filteredTours.map(t => t.id) : [])}
                  />
                </TableCell>
                {['Name', 'Driver', 'Start Time', 'Actions'].map(h => <TableCell key={h}><strong>{h}</strong></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTours.length ? filteredTours.map(tour => {
                const isChecked = selected.includes(tour.id);
                return (
                  <TableRow key={tour.id} hover selected={isChecked}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={isChecked} onClick={e => { e.stopPropagation(); handleSelect(tour.id); }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tour.color }} />
                        <Box>
                          <Typography fontWeight="bold">{tour.tour_name} - {tour.date}</Typography>
                          <Typography variant="body2" color="text.secondary">{tour.amount} orders · {tour.timeRange}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{tour.driver}</TableCell>
                    <TableCell>{tour.timeRange}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button variant="outlined"  onClick={() => navigate(`/Admin_TourMapView/${tour.id}`)}
                        size='small'
                          sx={(theme) => ({
                            padding: '8px 24px',
                            borderRadius: '4px',
                            textTransform: 'none',
                            fontWeight: '500',
                            background: theme.palette.primary.gradient,
                            color: theme.palette.primary.contrastText,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              background: theme.palette.primary.dark,
                              color: theme.palette.primary.contrastText,
                            }                
                          })}
                          >View Map</Button>
                        <IconButton onClick={e => { setAnchorEl(e.currentTarget); setCurrentTour(tour); }}><MoreVert /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No tours found.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setModalOpen(true); setAnchorEl(null); }}>Edit Tour</MenuItem>       
            <Divider />
            <MenuItem onClick={() => { setViewPicklistModalOpen(true); setAnchorEl(null); }}>View Picklist</MenuItem>
       
            <Divider />
            <MenuItem sx={{ color: 'error.main' }} onClick={() => currentTour && handleDelete([currentTour.id])}>Delete</MenuItem>
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
              }else{
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

export default LiveTours;
