import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, Checkbox, Button, IconButton, Menu, MenuItem,
    TextField, Card, CardContent, CardHeader, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import latestOrderServices, { TourInfo } from './AdminServices/latestOrderServices'; // Singleton service
import '../Admin/css/Admin_TourTemplate.css';

// UI-only Tour structure for rendering
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    // Fetch and map tours from backend on mount
    useEffect(() => {
        const fetchTours = async () => {
            try {
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
                
            } catch (error) {
                console.error('Error fetching tours:', error);
            }
        };

        fetchTours();
    }, []);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box p={3} sx={{ minHeight: '100vh' }}>
            <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                <CardHeader
                    title="Tour Overview"
                    sx={{ bgcolor: '#1976d2', color: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                />
                <CardContent>
                    <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={2} gap={2}>
                        <TextField placeholder="Suchen…" size="small" sx={{ flexGrow: 1, maxWidth: 300 }} />
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Button variant="outlined" color="error">Delete selection</Button>
                            <Button variant="outlined" color="primary">Export</Button>
                            <Button variant="outlined" color="secondary">Merge</Button>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell padding="checkbox"><Checkbox /></TableCell>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Driver name</strong></TableCell>
                                <TableCell><strong>Period</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tours.map((tour) => (
                                <TableRow key={tour.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox />
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
                                                    0 Goals · Quantity {tour.amount} · {tour.timeRange}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{tour.driver}</TableCell>
                                    <TableCell>{tour.timeRange}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Button
                                                variant="contained"
                                                color="warning"
                                                size="small"
                                                onClick={() => navigate(`/Admin_TourMapView/${tour.id}`)} >
                                                To the Map →
                                            </Button>

                                            <IconButton onClick={handleMenuClick}>
                                                <MoreVertIcon />
                                            </IconButton>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={Boolean(anchorEl)}
                                                onClose={handleMenuClose}
                                            >
                                                <MenuItem>Option 1</MenuItem>
                                                <MenuItem>Option 2</MenuItem>
                                            </Menu>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Admin_TourTemplates;
