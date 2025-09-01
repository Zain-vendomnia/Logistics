
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Divider,
  IconButton,
  Avatar,
  Stack,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import adminApiService from '../../services/adminApiService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { useParams } from 'react-router-dom';
import latestOrderServices from './AdminServices/latestOrderServices';
import "./css/Admin_TourMapView.css";
import 'leaflet-polylinedecorator';
import { AccessTime, Article, ProductionQuantityLimits } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import CustomerEditModal from './CustomerEditModal';
import { Console } from 'console';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

import { handlePermit } from '../../utils/handleHelper';


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
type Order = {
  order_id: number;
  // add other properties as needed (e.g., name, address, status, etc.)
  [key: string]: any;
};

type Tours = {
  id: number;
  orders: Order[];
  [key: string]: any;
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [lastEdited, setLastEdited] = useState<number | null>(null);

  const [permitTourIds, setPermitTourIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);


  const navigate = useNavigate();
  useEffect(() => {
    // const instance = latestOrderServices.getInstance();
    const fetchData = async () => {
      const now = Date.now();
      // If edited in the last 5 seconds, skip this fetch
      const instance = latestOrderServices.getInstance();
      const toursdata = await instance.getTours();
      const tour = toursdata.find((tour: any) => tour.id === Number(tour_id));

      // Optional: Only update if tour has changed
      if (JSON.stringify(tour) !== JSON.stringify(selectedTour)) {
        setSelectedTour(tour);
      }
    };
    fetchData();
  }, [tour_id]);

  console.log(selectedTour);

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


  const handleEditCustomer = (customer: any) => {
    
    setSelectedCustomer(customer); 
    setEditModalOpen(true);        
  };

  const blink = {
    animation: 'blinker 1.5s linear infinite',
    '@keyframes blinker': {
      '50%': { opacity: 0.5 }
    }
  };
  const livePulse = {
    display: 'inline-flex',
    alignItems: 'center',
    '&::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#00e676',
      marginRight: '8px',
      animation: 'pulse 1.2s infinite ease-in-out',
    },
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(0.8)',
        opacity: 0.7,
      },
      '50%': {
        transform: 'scale(1.2)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(0.8)',
        opacity: 0.7,
      },
    },
  };
  const createIcon = useMemo(() => {
    return (label: string, bgColor: string) =>
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
  }, []);

  const zoomToStop = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([lat, lon], 15, { duration: 0.5 });
    }
  };

  const PolylineDecoratorComponent = React.memo(({ positions }: { positions: [number, number][] }) => {
    const map = useMap();

    useEffect(() => {
      if (!selectedTour) return;

      const polyline = L.polyline(positions, {
        color: selectedTour.tour_route_color,
        weight: 5,
        opacity: 0.7,
      }).addTo(map);

      const arrowHead = L.Symbol.arrowHead({
        pixelSize: 10,
        pathOptions: { stroke: true, color: selectedTour.tour_route_color }
      });

      const decorator = (L as any).polylineDecorator(polyline, {
        patterns: [{
          offset: '20%',
          repeat: '100px',
          symbol: arrowHead,
        }],
      }).addTo(map);

      return () => {
        map.removeLayer(polyline);
        map.removeLayer(decorator);
      };
    }, [map, positions, selectedTour]);

    return null;
  });

  if (loading || !selectedTour) return <div>Loading route data...</div>;

  const formattedDate = new Date(selectedTour.tour_date);
  const cleanDate = formattedDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format the tour start time (remove trailing :00)
  const cleanStartTime = selectedTour.tour_startTime.replace(/:00$/, '');

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const response = await adminApiService.update_tourstatus(selectedTour.id);
      if (response.status === 200) {
        setSelectedTour((prev: any) => ({ ...prev, tour_status: 'confirmed' }));

        // Send Logistics Email to Customer
        console.log(handlePermit([selectedTour.id]));

      } else {
        console.error('Update failed:', response);
        alert('Failed to update tour status.');
      }
    } catch (error) {
      console.error('Error confirming tour:', error);
      alert('An error occurred while confirming the tour.');
    } finally {
      setLoading(false);
    }
  };

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
            {selectedTour.tour_startTime}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          {stops.map((stop, index) => {
            const isWarehouse = stop.location_id === "v1";
            const matchedOrder = selectedTour?.orders?.find(
              (order: any) => order.order_id === Number(stop.location_id)
            );
            // console.log("matchedOrder"+ JSON.stringify(matchedOrder));


            // Skip rendering if not a warehouse and there's no matching order
            if (!isWarehouse && !matchedOrder) return null;

            return (

              <ListItem
                key={index}
                disableGutters
                sx={{
                  mb: 1,
                  borderBottom: '1px dashed #ccc',
                  pb: 1,
                  alignItems: 'flex-start',
                  position: 'relative', // Enable absolute positioning inside
                }}
              >
                {/* === Top-right Button Stack === */}
                {!isWarehouse && matchedOrder && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        '& .MuiIconButton-root:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s ease',
                        },
                      }}
                    >
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <Typography variant="caption">
                            Total Qty:{' '}
                            <strong>
                              {matchedOrder.items.reduce(
                                (total: number, item: any) => total + Number(item.quantity),
                                0
                              )}
                            </strong>
                          </Typography>
                        }
                      >
                        <IconButton size="small" color="primary">
                          <ProductionQuantityLimits fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <ul style={{ margin: 0, padding: '4px 8px', listStyle: 'none' }}>
                            {matchedOrder.items.map((item: any, i: number) => (
                              <li key={i}>
                                <Typography component="span" variant="caption">
                                  <strong>{item.slmdl_articleordernumber}</strong>
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        }
                      >
                        <IconButton size="small" color="success">
                          <Article fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="View Time Log" arrow placement="top">
                        <IconButton size="small" color="warning">
                          <AccessTime fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Customer" arrow placement="top">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleEditCustomer(matchedOrder)}
                        >
                          <NoteAltIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}

                {/* === Main Content === */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: selectedTour?.tour_route_color,
                      width: 28,
                      height: 28,
                      fontSize: 14,
                      mt: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {stop.type === 'start' ? 'S' : stop.type === 'end' ? 'E' : index}
                  </Avatar>
                  <Box sx={{ ml: 2, flexGrow: 1, minWidth: 0 }}>
                    {/* Order Info Box with zoom */}
                    <Box
                      onClick={() =>
                        stop.type !== 'start' && stop.type !== 'end' && zoomToStop(stop.lat, stop.lon)
                      }
                      sx={{
                        cursor: stop.type !== 'start' && stop.type !== 'end' ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor:
                            stop.type !== 'start' && stop.type !== 'end' ? 'action.hover' : 'transparent',
                        },
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {isWarehouse ? (
                        <Typography variant="body2" fontWeight="bold">
                          {selectedTour?.warehouseaddress || 'Warehouse Address Not Available'}
                        </Typography>
                      ) : (
                        <Typography fontWeight="bold" variant="body2">
                          Order ID: {stop?.location_id || 'N/A'}
                        </Typography>
                      )}

                      {matchedOrder && (
                        <>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            <Box component="span" color="text.secondary">{matchedOrder.firstname}</Box>
                          </Typography>
                          <Typography variant="caption" display="block">
                            <Box component="span" color="text.secondary">{matchedOrder.lastname}</Box>
                          </Typography>
                          <Typography variant="caption" display="block">
                            <Box component="span" color="text.secondary">{matchedOrder.street}</Box>
                          </Typography>
                          <Typography variant="caption" display="block">
                            <Box component="span" color="text.secondary">{matchedOrder.city}</Box>
                          </Typography>
                          <Typography variant="caption" display="block">
                            <Box component="span" color="text.secondary">{matchedOrder.zipcode}</Box>
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            <Box component="span" fontWeight="bold">Order Number: </Box>
                            <Box component="span" color="text.secondary">{matchedOrder.order_number}</Box>
                          </Typography>
                        </>
                      )}

                      <Typography variant="caption" display="block" mt={0.5}>
                        <Box component="span" fontWeight="bold">Arrival Time: </Box>
                        <Box component="span" color="text.secondary">
                          {stop?.arrival
                            ? new Date(stop.arrival).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                            : 'Time Not Set'}
                        </Box>
                      </Typography>
                    </Box>

                    {/* Status Log Box without zoom */}
                    {stop.type !== 'start' && stop.type !== 'end' && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                          Status Logs
                        </Typography>

                        <List dense disablePadding style={{ marginTop: '-5px' }}>
                          <ListItem
                            key="log-1"
                            disableGutters
                            component="div"
                            onClick={() => navigate('/ProofdeliveryLiveloc')}
                            sx={{
                              alignItems: 'flex-start',
                              pb: 0.5,
                              borderBottom: '1px dashed #ddd',
                              mb: 0.5,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#f5f5f5',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32, mt: 0.2 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="caption" color="text.secondary">
                                  2025-06-04 08:00
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                  Service successfully provided
                                </Typography>
                              }
                            />
                          </ListItem>

                          <ListItem
                            key="log-2"
                            disableGutters
                            component="div"
                            onClick={() => navigate('/ProofdeliveryImage')}
                            sx={{
                              alignItems: 'flex-start',
                              pb: 0.5,
                              borderBottom: '1px dashed #ddd',
                              mb: 0.5,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#f5f5f5',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32, mt: 0.2 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="caption" color="text.secondary">
                                  2025-06-04 09:20
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                  Delivered
                                </Typography>
                              }
                            />
                          </ListItem>
                        </List>

                      </Box>
                    )}
                  </Box>


                </Box>
              </ListItem>

            );
          })}
        </List>
        <Box display="flex" justifyContent="center" mt={2}>
          {selectedTour.tour_status === 'pending' ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleConfirm}
              disabled={loading}
              sx={(theme) => ({
                padding: '8px 24px',
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: '500',
                background: theme.palette.warning.dark,
                color: theme.palette.warning.contrastText,
                borderColor: theme.palette.warning.main,
                transition: 'all 0.3s ease',
                ...blink,
                '&:hover': {
                  background: theme.palette.warning.main,
                  color: theme.palette.warning.contrastText,
                  opacity: 1,
                },
              })}
            >
              {loading ? 'Confirming...' : 'Confirm'}
            </Button>
          ) : selectedTour.tour_status === 'live' ? (
            <Button
              variant="contained"
              size="small"
              disabled
              sx={(theme) => ({
                padding: '8px 24px',
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: '500',
                backgroundColor: theme.palette.info.main,
                color: theme.palette.info.contrastText,
                ...livePulse,
              })}
            >
              Live
            </Button>
          ) : selectedTour.tour_status === 'completed' ? (
            <Button
              variant="contained"
              size="small"
              disabled
              sx={(theme) => ({
                padding: '8px 24px',
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: '500',
                backgroundColor: theme.palette.grey[700],
                color: theme.palette.common.white,
              })}
            >
              Completed
            </Button>
          ) : (
            <Chip
              label="✔ Confirmed"
              color="success"
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                px: 2,
                py: 1,
                borderRadius: '4px',
                backgroundColor: (theme) => theme.palette.success.main,
                color: (theme) => theme.palette.success.contrastText,
              }}
            />
          )}
        </Box>
      </Paper>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[stops[0]?.lat || 51.191566, stops[0]?.lon || 10.00519]}
          zoom={13} maxZoom={19}
          ref={mapRef}
          style={{ height: "100vh", width: "100%" }}
        >
          {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' detectRetina={true} /> */}
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiemFpbi12ZW5kb21uaWEiLCJhIjoiY204ZmlramFxMGNzazJscHRjNGs5em80NyJ9.1nIfy1EdSPl2cYvwvxOEmA`}
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap contributors'
            detectRetina={true}
            tileSize={512}
            zoomOffset={-1}
          />
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
              <Popup className="custom-popup">
                <div className="popup-content">
                  <div className="popup-title" style={{ color: selectedTour.tour_route_color }}>
                    {stop.location_id}
                  </div>

                  <div>
                    <span className="popup-label">Type : </span>
                    <span className="popup-value">{stop.type}</span>
                  </div>

                  <div>
                    <span className="popup-label">Arrival : </span>
                    <span className="popup-value">
                      {new Date(stop.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 👇 Only for warehouse stop (v1) */}
                  {stop.location_id === "v1" ? (
                    <div>
                      <span className="popup-label">Address : </span>
                      <span className="popup-value">{selectedTour.warehouseaddress}</span>
                    </div>
                  ) : (
                    // 👇 For customer stop: matchedOrder content
                    selectedTour?.orders && (() => {
                      const matchedOrder = selectedTour.orders.find(
                        (order: any) => order.order_id === Number(stop.location_id)
                      );

                      return matchedOrder ? (
                        <>
                          <div className="popup-section">
                            <span className="popup-label" style={{ fontWeight: 'bold' }}>OrderNumber : </span>
                            <span className="popup-value" style={{ fontWeight: 'bold', color: selectedTour.tour_route_color }}>
                              {matchedOrder.order_number}
                            </span>
                          </div>
                          <div className="popup-section">
                            <span className="popup-label">Customer : </span>
                            <span className="popup-value" style={{ fontWeight: 'bold', color: selectedTour.tour_route_color }}>
                              {matchedOrder.firstname} {matchedOrder.lastname}
                            </span>
                          </div>
                          <div>
                            <span className="popup-label">Address : </span>
                            <span className="popup-value">
                              {matchedOrder.street}, {matchedOrder.city}, {matchedOrder.zipcode}
                            </span>
                          </div>
                          <div style={{ marginTop: '5px' }}>
                            <span className="popup-label">Invoice Amount : </span>
                            <span className="popup-invoice" style={{ color: selectedTour.tour_route_color }}>€{matchedOrder.invoice_amount}</span>
                          </div>
                          <div className="popup-section">
                            <span className="popup-label">Items : </span>
                            <ul className="popup-items">
                              {matchedOrder.items.map((item: any, index: number) => (
                                <li key={index}>
                                  <span className="popup-article">Article : </span>
                                  <span className="popup-article-value" style={{ color: selectedTour.tour_route_color, fontWeight: 'bold' }}>
                                    {item.slmdl_articleordernumber}
                                  </span>,&nbsp;
                                  <span className="popup-quantity">Qty : </span>
                                  <span className="popup-quantity-value" style={{ color: selectedTour.tour_route_color, fontWeight: 'bold' }}>
                                    {item.quantity}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="popup-error">Order not found for this stop.</div>
                      );
                    })()
                  )}
                </div>
              </Popup>

            </Marker>
          ))}

        </MapContainer>
      </Box>

      <CustomerEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        customer={selectedCustomer}
        allCustomers={selectedTour || []}
        notice={selectedCustomer?.route_segment_notice || ''} 
        tourId = {tour_id}
        color={selectedTour?.tour_route_color}
        onSave={(updatedCustomer) => {
          setSelectedTour((prev: Tours | null) => {
            if (!prev) return prev;

            const updatedOrders = prev.orders.map((order: Order) =>
              order.order_id === updatedCustomer.order_id ? updatedCustomer : order
            );

            return { ...prev, orders: updatedOrders };
          });
          setLastEdited(Date.now());
        }}
      />
    </Box>

  );
};

export default TourMapPage;
