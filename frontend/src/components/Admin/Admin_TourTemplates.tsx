import React, { useEffect, useState, useMemo, MouseEvent, ChangeEvent } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Checkbox, Button, IconButton, Menu, MenuItem, TextField, Card, CardContent,
  CardHeader, Divider, Tooltip, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MoreVert as MoreVertIcon, Delete as DeleteIcon, FileDownload as FileDownloadIcon, Merge as MergeIcon } from '@mui/icons-material';

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
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const ActionButton = ({ title, icon, color, onClick, disabled }: {
  title: string, icon: JSX.Element, color: 'error' | 'secondary' | 'primary',
  onClick: () => void, disabled: boolean
}) => (
  <Tooltip title={title}>
    <span>
      <Button variant="contained" color={color} startIcon={icon} size="small" onClick={onClick} disabled={disabled}>
        {title}
      </Button>
    </span>
  </Tooltip>
);

export const Admin_TourTemplates = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const loadTours = async () => {
    try {
      const instance = latestOrderServices.getInstance();
      const tourData = await instance.RealTimeToursData();
      const mapped = tourData.map(({ id, tour_name, tour_comments, tour_date, tour_route_color, orders, tour_startTime, tour_endTime, driver }: TourInfo): Tour => ({
        id: id.toString(),
        tour_name,
        tour_comments,
        date: new Date(tour_date).toLocaleDateString(),
        color: tour_route_color,
        amount: orders.length,
        timeRange: `${tour_startTime.slice(0, 5)} - ${tour_endTime.slice(0, 5)}`,
        driver: driver?.driver_name || 'N/A',
        driver_id: driver?.driver_id || 0
      }));
      setTours(mapped);
    } catch (error) {
      console.error('Error fetching tours:', error);
      showSnackbar('Failed to load tours', 'error');
    }
  };

  useEffect(() => { loadTours(); }, []);

  const filteredTours = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return term ? tours.filter(tour => [tour.tour_name, tour.driver, tour.date, tour.timeRange, tour.id]
      .some(field => field?.toLowerCase().includes(term))) : tours;
  }, [tours, searchTerm]);

  const isSelected = (id: string) => selected.includes(id);

  const handleSelectAllClick = (e: ChangeEvent<HTMLInputElement>) =>
    setSelected(e.target.checked ? filteredTours.map(t => t.id) : []);

  const handleCheckboxClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const showSnackbar = (message: string, severity: SnackbarState['severity']) =>
    setSnackbar({ open: true, message, severity });

  const handleAction = async (action: 'delete' | 'merge' | 'export') => {
    if (!selected.length) return showSnackbar('No tours selected', 'warning');

    try {
      if (action === 'delete') await handleDelete(selected);
      if (action === 'merge') {
        if (selected.length === 2) {
          console.log('Merging tours:', selected);
          showSnackbar('Merge functionality not yet implemented', 'info');
        } else {
          showSnackbar('Select exactly two tours to merge', 'warning');
        }
      }
      if (action === 'export') {
        await exportTours(selected);
        showSnackbar(`Successfully exported ${selected.length} tour(s)`, 'success');
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      showSnackbar(`${action.charAt(0).toUpperCase() + action.slice(1)} failed`, 'error');
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteTours(ids);
      await loadTours();
      setSelected(prev => prev.filter(id => !ids.includes(id)));
      showSnackbar(`Deleted ${ids.length} tour(s)`, 'success');
    } catch (error) {
      console.error('Delete failed:', error);
      showSnackbar('Failed to delete tour(s)', 'error');
    }
  };

  const handleMenuClose = (): void => setAnchorEl(null);
  return (
    <Box p={3} sx={{ minHeight: '100vh' }}>
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardHeader title="Tour Overview" sx={{
          bgcolor: '#1976d2', color: 'white',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          '& .MuiCardHeader-action': { alignSelf: 'center' }
        }} />
        <CardContent>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
            <TextField placeholder="Search tours..." size="small" sx={{ flexGrow: 1, maxWidth: 300 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Box display="flex" gap={1} flexWrap="wrap">
              <ActionButton title="Delete" icon={<DeleteIcon />} color="error" onClick={() => handleAction('delete')} disabled={!selected.length} />
              <ActionButton title="Merge" icon={<MergeIcon />} color="secondary" onClick={() => handleAction('merge')} disabled={selected.length !== 2} />
              <ActionButton title="Export" icon={<FileDownloadIcon />} color="primary" onClick={() => handleAction('export')} disabled={!selected.length} />
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
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {['Name', 'Driver', 'Period', 'Actions'].map(title => (
                  <TableCell key={title}><strong>{title}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTours.map(tour => {
                const selectedRow = isSelected(tour.id);
                return (
                  <TableRow key={tour.id} hover selected={selectedRow}
                    sx={{ '&:hover td': { bgcolor: selectedRow ? 'action.selected' : '' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedRow} onClick={e => handleCheckboxClick(e, tour.id)} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: tour.color }} />
                        <Box>
                          <Typography fontWeight="bold">{tour.tour_name} - {tour.date}</Typography>
                          <Typography variant="body2" color="text.secondary">{tour.amount} orders · {tour.timeRange}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{tour.driver}</TableCell>
                    <TableCell>{tour.timeRange}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button variant="outlined" color="warning" size="small" onClick={() => navigate(`/Admin_TourMapView/${tour.id}`)}>View Map</Button>
                        <IconButton onClick={e => { setAnchorEl(e.currentTarget); setCurrentTour(tour); }}><MoreVertIcon /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setModalOpen(true); setAnchorEl(null); }}>Edit Tour</MenuItem>

            <MenuItem 
  onClick={() => {
    if (currentTour) {
      navigate('/Admin_PickList', { state: { tour: currentTour } });
    }
    handleMenuClose();
  }}
>
  Generate Pick List
</MenuItem>

            <Divider />
            <MenuItem onClick={() => currentTour && handleDelete([currentTour.id])} sx={{ color: 'error.main' }}>Delete</MenuItem>
          </Menu>

          <EditTourModal
            open={modalOpen}
            handleClose={() => setModalOpen(false)}
            tourData={currentTour}
            onTourUpdated={() => {
              loadTours();
              showSnackbar('Tour updated successfully', 'success');
            }}
          />
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Admin_TourTemplates;
