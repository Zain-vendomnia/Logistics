import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
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

type Stop = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  arrival: string;
};

const stops: Stop[] = [
  { id: 1, name: "Tobias Gleim", address: "Auer Str. 35", lat: 51.181, lng: 10.313, arrival: "07:15" },
  { id: 2, name: "Günter Montag", address: "Bergstr. 4", lat: 51.193, lng: 10.43, arrival: "07:42" },
  { id: 3, name: "Uwe Lenzner", address: "Grünstr 23", lat: 51.210, lng: 10.45, arrival: "08:14" },
  { id: 4, name: "Ricco Wendelmuth", address: "Thomas-Müntzer Straße 6", lat: 51.211, lng: 10.47, arrival: "08:24" },
  { id: 5, name: "Philipp Dörbaum", address: "Schadebergstr. 28", lat: 51.222, lng: 10.49, arrival: "08:30" },
  { id: 6, name: "Helga Esser", address: "Schulstr. 7", lat: 51.247, lng: 10.54, arrival: "09:04" },
  { id: 7, name: "Jürgen Wolfien", address: "Rosa-Luxemburg-Str. 20", lat: 51.26, lng: 10.58, arrival: "09:49" },
];

const TourMapPage: React.FC = () => {
  const positions = stops.map((stop) => [stop.lat, stop.lng] as [number, number]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
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
          Tour HJUWQGLHU
        </Typography>
        <Typography variant="body2" color="textSecondary">
          19 Ziele • 07:00 - 19:00 <br />
          10h 30m Dauer • 372.12 km Strecke
        </Typography>

        <Divider sx={{ my: 2 }} />

        <List disablePadding>
          {stops.map((stop) => (
            <ListItem
              key={stop.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: 1.5,
                borderBottom: '1px dashed #ccc',
                pb: 1,
              }}
            >
              <Avatar sx={{ bgcolor: '#d32f2f', width: 28, height: 28, fontSize: 14, mt: 0.5 }}>
                {stop.id}
              </Avatar>

              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Typography fontWeight="bold">{stop.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {stop.address}
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

      {/* Map */}
      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[stops[0].lat, stops[0].lng]}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stops.map((stop) => (
            <Marker key={stop.id} position={[stop.lat, stop.lng]}>
              <Popup>
                <strong>{stop.name}</strong>
                <br />
                {stop.address}
                <br />
                Ankunft: {stop.arrival}
              </Popup>
            </Marker>
          ))}

          <Polyline positions={positions} color="blue" />
        </MapContainer>
      </Box>
    </Box>
  );
};

export default TourMapPage;
