import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, Checkbox, Button, IconButton, Menu, MenuItem,
    TextField, Card, CardContent, CardHeader, Divider, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MergeIcon from '@mui/icons-material/Merge';
import latestOrderServices, { TourInfo } from './AdminServices/latestOrderServices';
import { deleteTours } from './AdminServices/tourDeletionServices';
import { exportTours } from './AdminServices/tourExportServices';
import '../Admin/css/Admin_TourTemplate.css';

interface Tour {
    id: string;
    tour_name: string; 
    date: string;
    color: string;
    amount: number;
    timeRange: string;
    driver: string;
}

export const Admin_TourTemplates = () => {
    const [tours, setTours] = useState<Tour[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const instance = latestOrderServices.getInstance();
<<<<<<< HEAD
                const tourData = await instance.getTours(); 
              
=======
                const tourData = await instance.getTours();

>>>>>>> 3a348fd879a83a2bb9a5b7470d9c18bf37c2d89b
                const mappedTours: Tour[] = tourData.map((tour: TourInfo) => ({
                    id: tour.id.toString(),
                    tour_name: tour.tour_name,
                    date: new Date(tour.tour_date).toLocaleDateString(),
<<<<<<< HEAD
                    color: tour.tour_route_color, 
                    amount: tour.orders.length,
                    timeRange: tour.tour_startTime.slice(0, 5) + ' - ' + tour.tour_endTime.slice(0, 5), 
=======
                    color: tour.tour_route_color,
                    amount: tour.orders.length,
                    timeRange: tour.tour_startTime.slice(0, 5) + ' - ' + tour.tour_endTime.slice(0, 5),
>>>>>>> 3a348fd879a83a2bb9a5b7470d9c18bf37c2d89b
                    driver: tour.driver?.driver_name || 'N/A',
                }));

                setTours(mappedTours);
            } catch (error) {
                console.error('Error fetching tours:', error);
            }
        };

        fetchTours();
    }, []);

    const filteredTours = useMemo(() => {
        if (!searchTerm.trim()) return tours;
        
        const lowerCaseSearch = searchTerm.toLowerCase();
        return tours.filter(tour => 
            tour.tour_name.toLowerCase().includes(lowerCaseSearch) ||
            (tour.driver && tour.driver.toLowerCase().includes(lowerCaseSearch)) ||
            tour.date.toLowerCase().includes(lowerCaseSearch) ||
            tour.timeRange.toLowerCase().includes(lowerCaseSearch)
        );
    }, [tours, searchTerm]);

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelected(event.target.checked ? filteredTours.map(tour => tour.id) : []);
    };

    const handleCheckboxClick = (event: React.MouseEvent<unknown>, id: string) => {
        event.stopPropagation();
        setSelected(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const isSelected = (id: string) => selected.includes(id);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteSelected = async () => {
        if (selected.length === 0) return;
        
        try {
            await deleteTours(selected);
            // Refresh the tour list after deletion
            const instance = latestOrderServices.getInstance();
            const tourData = await instance.getTours();
            const mappedTours: Tour[] = tourData.map((tour: TourInfo) => ({
                id: tour.id.toString(),
                tour_name: tour.tour_name,
                date: new Date(tour.tour_date).toLocaleDateString(),
                color: tour.tour_route_color,
                amount: tour.orders.length,
                timeRange: tour.tour_startTime.slice(0, 5) + ' - ' + tour.tour_endTime.slice(0, 5),
                driver: tour.driver?.driver_name || 'N/A',
            }));
            setTours(mappedTours);
            setSelected([]);
        } catch (error) {
            console.error('Error deleting tours:', error);
        }
    };

    const handleMergeSelected = () => {
        if (selected.length !== 2) {
            console.log('Please select exactly 2 tours to merge');
            return;
        }
        console.log('Merging tours:', selected);
        // Actual merge logic will be implemented later
    };

    // Update the handleExportSelected function in the component
    const handleExportSelected = async () => {
        if (selected.length === 0) {
            console.log('No tours selected for export');
            return;
        }
        
        try {
            await exportTours(selected);
            // Optional: Show success message to user
        } catch (error) {
            console.error('Export failed:', error);
            // Optional: Show error message to user
        }
    };
    
    return (
        <Box p={3} sx={{ minHeight: '100vh' }}>
            <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                <CardHeader
                    title="Tour Overview"
                    sx={{ 
                        bgcolor: '#1976d2', 
                        color: 'white', 
                        borderTopLeftRadius: 16, 
                        borderTopRightRadius: 16,
                        '& .MuiCardHeader-action': {
                            alignSelf: 'center'
                        }
                    }}
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
                            <Tooltip title={selected.length > 0 ? `Delete ${selected.length} selected items` : "Delete selected items"}>
                                <Button 
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    size="small"
                                    onClick={handleDeleteSelected}
                                    disabled={selected.length === 0}
                                >
                                    Delete
                                </Button>
                            </Tooltip>
                            <Tooltip title={selected.length > 0 ? `Merge ${selected.length} selected tours` : "Merge selected tours"}>
                                <Button 
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<MergeIcon />}
                                    size="small"
                                    onClick={handleMergeSelected}
                                    disabled={selected.length !== 2}
                                >
                                    Merge
                                </Button>
                            </Tooltip>
                            <Tooltip title={selected.length > 0 ? `Export ${selected.length} selected items` : "Export selected items"}>
                                <Button 
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FileDownloadIcon />}
                                    size="small"
                                    onClick={handleExportSelected}
                                    disabled={selected.length === 0}
                                >
                                    Export
                                </Button>
                            </Tooltip>
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
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        selected={isItemSelected}
                                        sx={{ '&:hover td': { bgcolor: isItemSelected ? 'action.selected' : '' } }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox 
                                                checked={isItemSelected}
                                                onClick={(event) => handleCheckboxClick(event, tour.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    backgroundColor: tour.color,
                                                }} />
                                                <Box>
                                                    <Typography fontWeight="bold">
                                                        {tour.tour_name} - {tour.date}
                                                    </Typography>
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
                                                <IconButton onClick={handleMenuClick}>
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
                        <MenuItem onClick={handleMenuClose}>Edit Tour</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Duplicate</MenuItem>
                        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>Delete</MenuItem>
                    </Menu>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Admin_TourTemplates;