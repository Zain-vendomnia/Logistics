import React, { useEffect, useState, useMemo, MouseEvent, ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Checkbox, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  TextField, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Tooltip,
  Snackbar,
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MergeIcon from '@mui/icons-material/Merge';

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

const ActionButton = ({ title, icon, color, onClick, disabled }: { title: string, icon: JSX.Element, color: 'error' | 'secondary' | 'primary', onClick: () => void, disabled: boolean }) => (
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
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });
    const navigate = useNavigate();

    const loadTours = async (): Promise<void> => {
        try {
            const instance = latestOrderServices.getInstance();
            const tourData = await instance.RealTimeToursData();
            const mappedTours: Tour[] = tourData.map((tour: TourInfo) => ({
                id: tour.id.toString(),
                tour_name: tour.tour_name,
                tour_comments: tour.tour_comments,
                date: new Date(tour.tour_date).toLocaleDateString(),
                color: tour.tour_route_color,
                amount: tour.orders.length,
                timeRange: `${tour.tour_startTime.slice(0, 5)} - ${tour.tour_endTime.slice(0, 5)}`,
                driver: tour.driver?.driver_name || 'N/A',
                driver_id: tour.driver?.driver_id || 0,
            }));
            setTours(mappedTours);
        } catch (error) {
            console.error('Error fetching tours:', error);
            showSnackbar('Failed to load tours', 'error');
        }
    };

    useEffect(() => {
        loadTours();
    }, []);

    const filteredTours = useMemo<Tour[]>(() => {
        const term = searchTerm.trim().toLowerCase();
        return term ? tours.filter(tour => 
            [tour.tour_name, tour.driver, tour.date, tour.timeRange, tour.id]
                .some(field => field?.toLowerCase().includes(term))
        ) : tours;
    }, [tours, searchTerm]);

    const isSelected = (id: string): boolean => selected.includes(id);

    const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>): void => {
        setSelected(event.target.checked ? filteredTours.map(t => t.id) : []);
    };

    const handleCheckboxClick = (event: MouseEvent<unknown>, id: string): void => {
        event.stopPropagation();
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => setSearchTerm(event.target.value);

    const handleMenuClick = (event: MouseEvent<HTMLElement>, tour: Tour): void => {
        setAnchorEl(event.currentTarget);
        setCurrentTour(tour);
    };

    const handleMenuClose = (): void => setAnchorEl(null);

    const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleDelete = async (ids: string[]) => {
        try {
            await deleteTours(ids);
            await loadTours();
            setSelected(prev => prev.filter(id => !ids.includes(id)));
            showSnackbar(`Successfully deleted ${ids.length} tour(s)`, 'success');
        } catch (error) {
            console.error('Delete failed:', error);
            showSnackbar('Failed to delete tour(s)', 'error');
        }
    };

    const handleAction = async (action: 'delete' | 'merge' | 'export'): Promise<void> => {
        if (selected.length === 0) {
            showSnackbar('No tours selected', 'warning');
            return;
        }

        try {
            if (action === 'delete') {
                await handleDelete(selected);
            }
            if (action === 'merge' && selected.length === 2) {
                console.log('Merging tours:', selected);
                showSnackbar('Merge functionality not yet implemented', 'info');
            }
            if (action === 'export') {
                await exportTours(selected);
                showSnackbar(`Successfully exported ${selected.length} tour(s)`, 'success');
            }
        } catch (error) {
            console.error(`${action.charAt(0).toUpperCase() + action.slice(1)} failed:`, error);
            showSnackbar(`${action.charAt(0).toUpperCase() + action.slice(1)} failed`, 'error');
        }
    };

    const handleMenuDelete = () => {
        if (!currentTour) return;
        handleDelete([currentTour.id]);
        handleMenuClose();
    };

    return (
        <Box p={3} sx={{ minHeight: '100vh' }}>
            <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                <CardHeader
                    title="Tour Overview"
                    sx={{ bgcolor: '#1976d2', color: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, '& .MuiCardHeader-action': { alignSelf: 'center' }}}
                />
                <CardContent>
                    <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
                        <TextField
                            placeholder="Search tours..."
                            size="small"
                            sx={{ flexGrow: 1, maxWidth: 300 }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <ActionButton 
                                title="Delete" 
                                icon={<DeleteIcon />} 
                                color="error" 
                                onClick={() => handleAction('delete')} 
                                disabled={selected.length === 0} 
                            />
                            <ActionButton 
                                title="Merge" 
                                icon={<MergeIcon />} 
                                color="secondary" 
                                onClick={() => handleAction('merge')} 
                                disabled={selected.length !== 2} 
                            />
                            <ActionButton 
                                title="Export" 
                                icon={<FileDownloadIcon />} 
                                color="primary" 
                                onClick={() => handleAction('export')} 
                                disabled={selected.length === 0} 
                            />
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
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Driver</strong></TableCell>
                                <TableCell><strong>Period</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTours.map((tour) => {
                                const isItemSelected = isSelected(tour.id);
                                return (
                                    <TableRow
                                        key={tour.id}
                                        hover
                                        selected={isItemSelected}
                                        sx={{ '&:hover td': { bgcolor: isItemSelected ? 'action.selected' : '' } }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isItemSelected}
                                                onClick={(e) => handleCheckboxClick(e, tour.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: tour.color }} />
                                                <Box>
                                                    <Typography fontWeight="bold">{tour.tour_name} - {tour.date}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {tour.amount} orders · {tour.timeRange}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{tour.driver}</TableCell>
                                        <TableCell>{tour.timeRange}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Button 
                                                    variant="outlined" 
                                                    color="warning" 
                                                    size="small" 
                                                    onClick={() => navigate(`/Admin_TourMapView/${tour.id}`)}
                                                >
                                                    View Map
                                                </Button>
                                                <IconButton onClick={(e) => handleMenuClick(e, tour)}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Menu 
                        anchorEl={anchorEl} 
                        open={Boolean(anchorEl)} 
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem onClick={() => { setModalOpen(true); handleMenuClose(); }}>
                            Edit Tour
                        </MenuItem>
                        <Divider />
                        <MenuItem 
                            onClick={handleMenuDelete} 
                            sx={{ color: 'error.main' }}
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
                            showSnackbar('Tour updated successfully', 'success');
                        }} 
                    />
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Admin_TourTemplates;