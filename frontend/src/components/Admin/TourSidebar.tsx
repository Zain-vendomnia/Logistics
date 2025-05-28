import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Divider,
  Avatar,
  ListItemButton,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CustomerEditModal from './CustomerEditModal';

type Stop = {
  id: string;
  location_id: string;
  lat: number;
  lon: number;
  arrival: string;
  type: string;
};

interface Props {
  selectedTour: any;
  stops: Stop[];
  routeDistance: number;
  routeTime: number;
  onStopClick: (lat: number, lon: number) => void;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const TourSidebar: React.FC<Props> = ({ selectedTour, stops, routeDistance, routeTime, onStopClick }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const openEditModal = (order: any) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedOrder(null);
  };

  const formattedDate = new Date(selectedTour.tour_date);
  const cleanDate = formattedDate.toISOString().split('T')[0];
  const cleanStartTime = selectedTour.tour_startTime.replace(/:00$/, '');

  return (
    <>
      <Paper sx={{ width: 340, p: 2, overflowY: 'auto', borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9' }} elevation={3}>
        <Typography variant="h6">
          {selectedTour.tour_name} - {cleanDate} {cleanStartTime}
        </Typography>

        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          <Typography variant="caption" sx={{ bgcolor: '#86d160', px: 1, py: 0.5, borderRadius: 1 }}>
            {stops.length} Stops
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: '#41d7eb', px: 1, py: 0.5, borderRadius: 1 }}>
            {routeDistance} km
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: '#f1aae9', px: 1, py: 0.5, borderRadius: 1 }}>
            {formatTime(routeTime)}
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: '#dec1ff', px: 1, py: 0.5, borderRadius: 1 }}>
            {selectedTour.tour_startTime} - {selectedTour.tour_endTime}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <List disablePadding>
          {stops.map((stop, index) => {
            const matchedOrder = selectedTour.orders?.find(
              (order: any) => order.order_id === Number(stop.location_id)
            );

            return (
              <ListItem
                key={index}
                sx={{
                  mb: 1,
                  borderBottom: '1px dashed #ccc',
                  pb: 1,
                  alignItems: 'flex-start',
                }}
                disableGutters
              >
                <ListItemButton onClick={() => onStopClick(stop.lat, stop.lon)}>
                  <Avatar
                    sx={{
                      bgcolor: selectedTour?.tour_route_color,
                      width: 28,
                      height: 28,
                      fontSize: 14,
                      mt: 0.5
                    }}
                  >
                    {stop.type === 'start' ? 'S' : stop.type === 'end' ? 'E' : index}
                  </Avatar>

                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    {stop.location_id === 'v1' ? (
                      <Typography variant="body2" fontWeight="bold">
                        {selectedTour.warehouseaddress}
                      </Typography>
                    ) : matchedOrder ? (
                      <>
                        <Typography variant="body2" fontWeight="bold">
                          {matchedOrder.firstname} {matchedOrder.lastname}
                        </Typography>
                        <Typography variant="caption">
                          {matchedOrder.street}, {matchedOrder.city}, {matchedOrder.zipcode}
                        </Typography>
                        <Typography variant="caption" display="block" fontWeight="bold">
                          Order Number: {matchedOrder.order_number}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="error">
                        Order not found
                      </Typography>
                    )}

                    <Typography variant="caption" display="block" mt={0.5}>
                      Arrival: {new Date(stop.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>

                  {matchedOrder && (
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(matchedOrder);
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {selectedOrder && (
        <CustomerEditModal
          open={editModalOpen}
          onClose={closeEditModal}
          customer={selectedOrder}
          color={selectedTour.tour_route_color}
        />
      )}
    </>
  );
};

export default TourSidebar;
