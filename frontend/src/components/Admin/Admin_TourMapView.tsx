import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  IconButton,
  Avatar,
  Stack,
  ListItemButton,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import adminApiService from '../../services/adminApiService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { useParams } from 'react-router-dom';
import latestOrderServices from './AdminServices/latestOrderServices';
import { Tour } from '@mui/icons-material';

type Stop = {
  id: string;
  location_id: string;
  lat: number;
  lon: number;
  arrival: string;
  type: string;
  name?: string;
  address?: string;
};

const TourMapPage: React.FC = () => {
  const { tour_id } = useParams<{ tour_id: string }>();
  const parsedTourId = tour_id ? parseInt(tour_id, 10) : null;
  const [routePoints, setRoutePoints] = useState<[number, number][][]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  const mapRef = useRef<L.Map>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeTime, setRouteTime] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const instance = latestOrderServices.getInstance();
      const toursdata = await instance.getTours();

      const tour = toursdata.find((tour: any) => tour.id === Number(tour_id));
      setSelectedTour(tour);
    };

    fetchData();
  }, [tour_id]);

  console.log(selectedTour);
  //console.log("stops" + JSON.stringify(stops));
  const fetchRouteData = async () => {
    try {
      if (parsedTourId !== null) {
        const response = await adminApiService.getRouteResponse(parsedTourId);
        const data = response.data;
        if (data && data.solution && data.solution.routes.length > 0) {
          const route = data.solution.routes[0];

          const distance = data.solution.distance; // in meters

          const distanceInKilometers = (distance / 1000).toFixed(2); // 2 decimal places
          setRouteDistance(parseFloat(distanceInKilometers)); // Set distance in kilometers

          const time = data.solution.time; // in seconds

          setRouteTime(time);
          const formattedRoutes = route.points.map((routePoint: { coordinates: [number, number][] }) =>
            routePoint.coordinates.map(([lon, lat]) => [lat, lon])
          );
          setRoutePoints(formattedRoutes);

          const mappedStops: Stop[] = route.activities.map((activity: any, index: number) => ({
            id: `${index + 1}`,
            location_id: activity.location_id,
            lat: activity.address.lat,
            lon: activity.address.lon,
            arrival: activity.arr_date_time,
            type: activity.type
          }));

          setStops(mappedStops);

        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching route data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
  }, [parsedTourId]);

  const createIcon = (label: string, bgColor: string) =>
    L.divIcon({
      html: `<div style="
        background-color: ${bgColor};
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      ">${label}</div>`,
      className: 'custom-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  const PolylineDecoratorComponent: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
    const map = useMap();

    useEffect(() => {
      const polyline = L.polyline(positions, {
        color: selectedTour.tour_route_color,
        weight: 5,
        opacity: 0.7,
      }).addTo(map);

      const decorator = (L as any).polylineDecorator(polyline, {
        patterns: [
          {
            offset: '5%',
            repeat: '30px',
            symbol: (L as any).Symbol.arrowHead({
              pixelSize: 12,
              polygon: false,
              pathOptions: { stroke: true, color: selectedTour.tour_route_color },
            }),
          },
        ],
      }).addTo(map);

      return () => {
        map.removeLayer(polyline);
        map.removeLayer(decorator);
      };
    }, [map, positions]);

    return null;
  };

  const zoomToStop = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([lat, lon], 15, { duration: 0.5 });
    }
  };

  if (loading) {
    return <div>Loading route data...</div>;
  }
  const formattedDate = new Date(selectedTour.tour_date);
  const cleanDate = formattedDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };



  // Format the tour start time (remove trailing :00)
  const cleanStartTime = selectedTour.tour_startTime.replace(/:00$/, '');
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Paper sx={{ width: 340, p: 2, overflowY: 'auto', borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9' }} elevation={3}>
        <Typography variant="h6">
          {selectedTour.tour_name} - {cleanDate} {cleanStartTime}
        </Typography>

        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          <Typography variant="caption" sx={{ bgcolor: '#86d160', px: 1, py: 0.5, borderRadius: 1 }}>
            {stops.length} Ziele
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
          {stops.map((stop, index) => (
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
              <ListItemButton onClick={() => zoomToStop(stop.lat, stop.lon)}>
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
                  <Typography fontWeight="bold" variant="body2">
                    Order ID: {stop.location_id}
                  </Typography>

                  {/* ✅ Find the matching order */}
                  {selectedTour?.orders && (() => {
                    const matchedOrder = selectedTour.orders.find(
                      (order: any) => order.order_id === Number(stop.location_id)
                    );

                    return matchedOrder ? (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          {matchedOrder.firstname} {matchedOrder.lastname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {matchedOrder.street}, {matchedOrder.city}, {matchedOrder.zipcode}
                        </Typography>
                        <Typography variant="caption" display="block" fontWeight="bold" mt={0.5}>
                          Order Number: {matchedOrder.order_number}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="error">
                        Order not found.
                      </Typography>
                    );
                  })()}

                  <Typography variant="caption" display="block" mt={0.5}>
                   Arrival: {new Date(stop.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </ListItemButton>

            </ListItem>
          ))}
        </List>


        <Divider sx={{ my: 2 }} />
      </Paper>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[stops[0]?.lat || 51.191566, stops[0]?.lon || 10.00519]}
          zoom={10}
          ref={mapRef}
          style={{ height: "100vh", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

          {routePoints.length > 0 &&
            routePoints.map((route, index) => (
              <PolylineDecoratorComponent key={index} positions={route} />
            ))}

          {stops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.lat, stop.lon]}
              icon={
                stop.type === 'start'
                  ? createIcon('S', selectedTour.tour_route_color)
                  : stop.type === 'end'
                    ? createIcon('E', selectedTour.tour_route_color)
                    : createIcon(String(index), selectedTour.tour_route_color)
              }
            >
              <Popup>
                <strong>{stop.location_id}</strong><br />
                Type: {stop.type}<br />
                Arrival: {new Date(stop.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />

                {/* ✅ Display matching order details */}
                {selectedTour?.orders && (() => {
                  const matchedOrder = selectedTour.orders.find(
                    (order: any) => order.order_id === Number(stop.location_id)
                  );

                  if (matchedOrder) {
                    return (
                      <>
                        <strong>Customer:</strong> {matchedOrder.firstname} {matchedOrder.lastname}<br />
                        <strong>Address:</strong> {matchedOrder.street}, {matchedOrder.city}, {matchedOrder.zipcode}<br />
                        <strong>Invoice Amount:</strong> €{matchedOrder.invoice_amount}<br />

                        {/* ✅ Display the items */}
                        <strong>Items:</strong>
                        <ul>
                          {matchedOrder.items.map((item: any, index: number) => (
                            <li key={index}>
                              <strong>Article Number:</strong> {item.slmdl_articleordernumber},
                              <strong>Quantity:</strong> {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </>
                    );
                  } else {
                    return <span>Order not found for this stop.</span>;
                  }
                })()}
              </Popup>

            </Marker>
          ))}

        </MapContainer>
      </Box>
    </Box>
  );
};

export default TourMapPage;
