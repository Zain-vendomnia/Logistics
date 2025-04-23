import React, { useEffect, useState } from 'react';
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

type Stop = {
  id: string;
  location_id: string;
  lat: number;
  lon: number;
  arrival: string;
  type: string;
};

const TourMapPage: React.FC = () => {
  const { tour_id } = useParams<{ tour_id: string }>();
  const parsedTourId = tour_id ? parseInt(tour_id, 10) : null;

  const [routePoints, setRoutePoints] = useState<[number, number][][]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRouteData = async () => {
    try {
      if (parsedTourId !== null) {
        const response = await adminApiService.getRouteResponse(parsedTourId);
        const data = response.data;
        console.log(data);

        if (data && data.solution && data.solution.routes.length > 0) {
          const route = data.solution.routes[0];

          // Map polyline points
          const formattedRoutes = route.points.map((routePoint: { coordinates: [number, number][] }) =>
            routePoint.coordinates.map(([lon, lat]) => [lat, lon])
          );
          setRoutePoints(formattedRoutes);

          // Map stops from activities
          const mappedStops: Stop[] = route.activities.map((activity: any, index: number) => ({
            id: activity.id || `${index + 1}`,
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

  const createNumberedIcon = (number: number) =>
    L.divIcon({
      html: `<div style="
        background-color: #d32f2f;
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      ">${number}</div>`,
      className: 'number-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

  const PolylineDecoratorComponent: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
    const map = useMap();

    useEffect(() => {
      const polyline = L.polyline(positions, {
        color: 'Navy',
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
              pathOptions: { stroke: true, color: 'Navy' },
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

  if (loading) {
    return <div>Loading route data...</div>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Paper
        sx={{
          width: 340,
          p: 2,
          overflowY: 'auto',
          borderRight: '1px solid #ddd',
          backgroundColor: '#f9f9f9',
        }}
        elevation={3}
      >
        <Typography variant="h6" gutterBottom>
          Tour {tour_id}
        </Typography>
        <Divider sx={{ my: 2 }} />

        <List disablePadding>
          {stops.map((stop, index) => (
            <ListItem key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: 1.5,
                borderBottom: '1px dashed #ccc',
                pb: 1,
              }}>
              <Avatar sx={{ bgcolor: '#d32f2f', width: 28, height: 28, fontSize: 14, mt: 0.5 }}>
                {index + 1}
              </Avatar>
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Typography fontWeight="bold">{stop.location_id}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {stop.type}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ankunft: {stop.arrival}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <IconButton size="small" color="primary">
                  <Inventory2Icon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="success">
                  <CameraAltIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="warning">
                  <NoteAltIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[stops[0]?.lat || 51.191566, stops[0]?.lon || 10.00519]}
          zoom={10}
          style={{ height: "100vh", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {routePoints.length > 0 &&
            routePoints.map((route, index) => (
              <PolylineDecoratorComponent key={index} positions={route} />
            ))}

          {stops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.lat, stop.lon]}
              icon={createNumberedIcon(index + 1)}
            >
              <Popup>
                <strong>{stop.location_id}</strong>
                <br />
                Type: {stop.type}
                <br />
                Arrival: {stop.arrival}
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </Box>
    </Box>
  );
};

export default TourMapPage;
