import React, { useEffect, useRef, useState } from "react";

import {
  Badge,
  Box,
  IconButton,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  Avatar,
  Stack,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";

import PolylineDecoratorWrapper from "./PolylineDecoratorWrapper";
import adminApiService from "./../../services/adminApiService";
import { DynamicTourPayload, Geometry, Stop } from "./../../types/tour.type";
import useDynamicTourStore from "./../../store/useDynamicTourStore";
import useLiveOrderUpdates from "./../../socket/useLiveOrderUpdates";
import { Order } from "./../../types/order.type";
import Tooltip from "@mui/material/Tooltip";
import {
  AccessTime,
  Article,
  ProductionQuantityLimits,
} from "@mui/icons-material";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useParams } from "react-router-dom";

import DynamicTourList from "./dynamic_tour/DynamicTourList";

// interface Stop {
//   location: { lat: number; lng: number };
//   time: { arrival: string; departure: string };
//   activities: { jobId: string; type: string }[];
// }

// interface RouteSection {
//   coordinates: [number, number][];
//   summary: any;
// }

// interface VehicleTour {
//   vehicleId: string;
//   sections: RouteSection[];
//   stops: Stop[];
// }

// interface DynamicTourPayload {
//   id?: number;
//   tour_number: string;
//   tour_route: VehicleTour;
//   orderIds: string; // Comma-separated
//   warehouse_id: number;
// }

// functions
// Marker Icons

const defaultIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const startIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const depotIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icon selection logic
const getStopIcon = (stop: Stop) => {
  const types = stop.activities.map((a) => a.type);
  if (types.includes("departure") && types.includes("arrival"))
    return depotIcon;
  if (types.includes("departure")) return startIcon;
  if (types.includes("arrival")) return endIcon;
  return defaultIcon;
};

const extract_Coords = (tours: Geometry[]): [number, number][] => {
  const array = Array.isArray(tours) ? tours : [tours];

  return array.flatMap((v) => [
    ...v.sections.flatMap((s) => s.coordinates),
    ...v.stops.map((s) => [s.location.lat, s.location.lng] as [number, number]),
  ]);
};

const colors = ["blue", "green", "red", "purple", "orange", "brown"];

const TourMapPage = () => {
  const mapRef = useRef<L.Map | null>(null);

  const [selectedTour, setSelectedTour] = useState<any | null>(null);

  const {
    pinboard_OrderList,
    lastFetchedAt,
    pinboard_AddOrders,

    setDynamicToursList,
  } = useDynamicTourStore();

  useLiveOrderUpdates((new_order) => {
    console.log(
      `[${new Date().toLocaleTimeString()}] - New Shop Order`,
      new_order
    );
    pinboard_AddOrders([new_order]);
  });

  const [vehicleTours, setVehicleTours] = useState<Geometry[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(
    vehicleTours.length === 0
  );

  const fallbackCoords: [number, number][] = [
    [52.520008, 13.404954], // Berlin Germany
    // [50.110924, 8.682127], // Frankfurt Germany
  ];

  let allCoords: [number, number][] = fallbackCoords;

  const flyToBoundsOptions = {
    padding: [50, 50],
    maxZoom: 15,
    duration: 1.5,
  };

  // Fetch Dynamic Tours
  useEffect(() => {
    const fetchTours = async () => {
      try {
        // const res = await adminApiService.plotheremap();
        const dynamic_tours = await adminApiService.fetchDynamicTours();

        const tours_route: Geometry[] = dynamic_tours.flatMap(
          (tour: DynamicTourPayload) => tour.tour_route || []
        );
        // const tours: VehicleTour[] = routes.map((vehicle: any) => ({
        //   vehicleId: vehicle.vehicleId,
        //   sections: vehicle.sections.map((section: any) => ({
        //     summary: section.summary,
        //     coordinates: section.coordinates.map((pt: any) => [pt.lat, pt.lng]),
        //   })),
        //   stops: vehicle.stops,
        // }));

        // console.log('Dynamic Tours: ', dynamic_tours)
        // setDynamicTours(dynamic_tours as DynamicTourPayload[]);
        setVehicleTours(tours_route);

        console.log('tours_route : ',tours_route);
      } catch (err) {
        console.error("API call failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  // mapRef to all tours
  useEffect(() => {
    if (!mapRef.current) return;

    if (!isLoading && vehicleTours.length > 0) {
      allCoords = extract_Coords(vehicleTours);

      const bounds = L.latLngBounds(allCoords);
      mapRef.current.flyToBounds(bounds, flyToBoundsOptions as any);

      // setTimeout(() => {
      //   mapRef.current?.setZoom(mapRef.current.getZoom() - 1); // zoom out 1 level
      // }, 1600);
    }
  }, [isLoading, vehicleTours]);

  // mapRef to selected tour
  useEffect(() => {
    if (!selectedTour || !selectedTour.tour_route || !mapRef.current) return;

    allCoords = extract_Coords(selectedTour.tour_route);

    const bounds = L.latLngBounds(allCoords);
    mapRef.current.flyToBounds(bounds, flyToBoundsOptions as any);
  }, [selectedTour]);

  // Fetch pinboard orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const now = Date.now();
        const staleAfter = 1000 * 60 * 30; // 30 minutes
        const isStale = !lastFetchedAt || now - lastFetchedAt > staleAfter;
        if (pinboard_OrderList.length === 0 || isStale) {
          const orders: Order[] =
            await adminApiService.fetchPinboardOrders(lastFetchedAt);

          console.error("Pin-b Orders: ", orders);

          const existingIds = new Set(
            pinboard_OrderList.map((o) => o.order_id)
          );
          const newOrders = orders.filter((o) => !existingIds.has(o.order_id));
          pinboard_AddOrders(newOrders);

          // Update map view
          const locations = orders.map((o) => o.location);
          if (mapRef.current && locations.length > 0) {
            const bounds = L.latLngBounds(locations as any);
            mapRef.current.flyToBounds(bounds, {
              padding: [50, 50],
              maxZoom: 6,
              duration: 1.5,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch pinboard Orders", err);
      }
    };

    fetchOrders();
  }, [pinboard_OrderList.length, lastFetchedAt, pinboard_AddOrders]);

  const handleReposition = () => {
    if (mapRef.current) {
      mapRef.current?.flyToBounds(
        L.latLngBounds(allCoords),
        flyToBoundsOptions as any
      );
    }
  };

  const pinTitle = (title: string) => {
    return (
      <Typography
        fontWeight={"bold"}
        variant="subtitle1"
        sx={{
          m: 0,
          p: 0,
          lineHeight: 1.2,
          display: "block",
          color: "primary.main",
        }}
        gutterBottom={false}
      >
        {title}
      </Typography>
    );
  };

  const formattedDate = new Date();
  const cleanDate = formattedDate.toISOString().split("T")[0]; // Extract YYYY-MM-DD
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const [stops, setStops] = useState<Stop[]>([]);

  // Format the tour start time (remove trailing :00)
  // const cleanStartTime = selectedTour.tour_startTime.replace(/:00$/, '');

  const [routePoints, setRoutePoints] = useState<[number, number][][]>([]);
  const [loading, setLoading] = useState(true);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeTime, setRouteTime] = useState<number>(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [lastEdited, setLastEdited] = useState<number | null>(null);
  const { tour_id } = useParams<{ tour_id: string }>();
  const parsedTourId = tour_id ? parseInt(tour_id, 10) : null;

  const fetchRouteData = async () => {
    try {
      if (parsedTourId !== null) {
        const response = await adminApiService.getRouteResponse(parsedTourId);
        const data = response.data;
        console.log("----> ", data);
        if (data && data.solution && data.solution.routes.length > 0) {
          const route = data.solution.routes[0];

          const distance = data.solution.distance; // in meters

          const distanceInKilometers = (distance / 1000).toFixed(2); // 2 decimal places
          setRouteDistance(parseFloat(distanceInKilometers)); // Set distance in kilometers

          const time = data.solution.time; // in seconds

          setRouteTime(time);
          const formattedRoutes = route.points.map(
            (routePoint: { coordinates: [number, number][] }) =>
              routePoint.coordinates.map(([lon, lat]) => [lat, lon])
          );
          setRoutePoints(formattedRoutes);

          const mappedStops: Stop[] = route.activities.map(
            (activity: any, index: number) => ({
              id: `${index + 1}`,
              location_id: activity.location_id,
              lat: activity.address.lat,
              lon: activity.address.lon,
              arrival: activity.arr_date_time,
              type: activity.type,
            })
          );
          console.log("mappedStops : ", route);
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

  const blink = {
    animation: "blinker 1.5s linear infinite",
    "@keyframes blinker": {
      "50%": { opacity: 0.5 },
    },
  };
  const livePulse = {
    display: "inline-flex",
    alignItems: "center",
    "&::before": {
      content: '""',
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: "#00e676",
      marginRight: "8px",
      animation: "pulse 1.2s infinite ease-in-out",
    },
    "@keyframes pulse": {
      "0%": {
        transform: "scale(0.8)",
        opacity: 0.7,
      },
      "50%": {
        transform: "scale(1.2)",
        opacity: 1,
      },
      "100%": {
        transform: "scale(0.8)",
        opacity: 0.7,
      },
    },
  };
  const zoomToStop = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([lat, lon], 15, { duration: 0.5 });
    }
  };

  return (
    <>
      <Box
        position="absolute"
        top={70}
        right={30}
        zIndex={1000}
        display="flex"
        gap={1}
      >
        <IconButton onClick={handleReposition}>
          <GpsFixedIcon sx={{ color: "#333", fontSize: 55 }} />
        </IconButton>
      </Box>

      <Box display="flex" height="100%" width="100%">
        {/* Left Panel */}
        <DynamicTourList />

        {/* Right Map */}
        <Box flexGrow={1} position="relative">
          {isLoading && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "primary.main",
                zIndex: 999,
              }}
            >
              <CircularProgress size={60} thickness={5} disableShrink />
            </Box>
          )}

          <Paper
            sx={{
              width: 340,
              p: 2,
              overflowY: "auto",
              borderRight: "1px solid #ddd",
              backgroundColor: "#f9f9f9",
            }}
            elevation={3}
          >
            <Typography variant="h6">
              {/*{selectedTour.tour_name} - {cleanDate} {cleanStartTime}*/}
            </Typography>

            <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
              <Typography
                variant="caption"
                sx={{ bgcolor: "#86d160", px: 1, py: 0.5, borderRadius: 1 }}
              >
                {stops.length} Ziele
              </Typography>
              <Typography
                variant="caption"
                sx={{ bgcolor: "#41d7eb", px: 1, py: 0.5, borderRadius: 1 }}
              >
                {routeDistance} km
              </Typography>
              <Typography
                variant="caption"
                sx={{ bgcolor: "#f1aae9", px: 1, py: 0.5, borderRadius: 1 }}
              >
                {formatTime(routeTime)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ bgcolor: "#dec1ff", px: 1, py: 0.5, borderRadius: 1 }}
              >
                {/*{selectedTour.tour_startTime}*/}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            <List disablePadding>
              {stops.map((stop, index) => {
                console.log("stops : ", stop);
                // const isWarehouse = stop.location_id === "v1";
                const isWarehouse = 1;
                const matchedOrder = selectedTour?.orders?.find(
                  // (order: any) => order.order_id === Number(stop.location_id)
                  (order: any) => order.order_id === Number(1)
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
                      borderBottom: "1px dashed #ccc",
                      pb: 1,
                      alignItems: "flex-start",
                      position: "relative", // Enable absolute positioning inside
                    }}
                  >
                    {/* === Top-right Button Stack === */}
                    {!isWarehouse && matchedOrder && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 2,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            "& .MuiIconButton-root:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.04)",
                              transform: "scale(1.05)",
                              transition: "all 0.2s ease",
                            },
                          }}
                        >
                          <Tooltip
                            arrow
                            placement="top"
                            title={
                              <Typography variant="caption">
                                Total Qty:{" "}
                                <strong>
                                  {matchedOrder.items.reduce(
                                    (total: number, item: any) =>
                                      total + Number(item.quantity),
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
                              <ul
                                style={{
                                  margin: 0,
                                  padding: "4px 8px",
                                  listStyle: "none",
                                }}
                              >
                                {matchedOrder.items.map(
                                  (item: any, i: number) => (
                                    <li key={i}>
                                      <Typography
                                        component="span"
                                        variant="caption"
                                      >
                                        <strong>
                                          {item.slmdl_articleordernumber}
                                        </strong>
                                      </Typography>
                                    </li>
                                  )
                                )}
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
                        </Stack>
                      </Box>
                    )}

                    {/* === Main Content === */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
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
                        {/*{stop.type === 'start' ? 'S' : stop.type === 'end' ? 'E' : index}*/}
                      </Avatar>
                      <Box sx={{ ml: 2, flexGrow: 1, minWidth: 0 }}>
                        {/* Order Info Box with zoom */}
                        <Box
                          // onClick={() =>
                          //   stop.type !== 'start' && stop.type !== 'end' && zoomToStop(stop.lat, stop.lon)
                          // }
                          sx={{
                            // cursor: stop.type !== 'start' && stop.type !== 'end' ? 'pointer' : 'default',
                            // '&:hover': {
                            //   backgroundColor:
                            //     stop.type !== 'start' && stop.type !== 'end' ? 'action.hover' : 'transparent',
                            // },
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {isWarehouse ? (
                            <Typography variant="body2" fontWeight="bold">
                              {selectedTour?.warehouseaddress ||
                                "Warehouse Address Not Available"}
                            </Typography>
                          ) : (
                            <Typography fontWeight="bold" variant="body2">
                              {/*Order ID: {stop?.location_id || 'N/A'}*/}
                            </Typography>
                          )}

                          {matchedOrder && (
                            <>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 0.5 }}
                              >
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.firstname}
                                </Box>
                              </Typography>
                              <Typography variant="caption" display="block">
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.lastname}
                                </Box>
                              </Typography>
                              <Typography variant="caption" display="block">
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.street}
                                </Box>
                              </Typography>
                              <Typography variant="caption" display="block">
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.city}
                                </Box>
                              </Typography>
                              <Typography variant="caption" display="block">
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.zipcode}
                                </Box>
                              </Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 0.5 }}
                              >
                                <Box component="span" fontWeight="bold">
                                  Order Number:{" "}
                                </Box>
                                <Box component="span" color="text.secondary">
                                  {matchedOrder.order_number}
                                </Box>
                              </Typography>
                            </>
                          )}

                          <Typography
                            variant="caption"
                            display="block"
                            mt={0.5}
                          >
                            <Box component="span" fontWeight="bold">
                              Arrival Time:{" "}
                            </Box>
                            {/*                    <Box component="span" color="text.secondary">
                              {stop?.arrival
                                ? new Date(stop.arrival).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Time Not Set'}
                            </Box>
*/}{" "}
                          </Typography>
                        </Box>

                        {/* Status Log Box without zoom */}
                        {/*               {stop.type !== 'start' && stop.type !== 'end' && (
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
                        )}*/}
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
          <MapContainer
            bounds={L.latLngBounds(allCoords)}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <MapReady
              onMapReady={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {pinboard_OrderList &&
              pinboard_OrderList.map(
                (order) =>
                  order && (
                    <Marker
                      key={order.order_id}
                      position={order.location}
                      icon={defaultIcon}
                    >
                      <Popup>
                        {pinTitle(order.order_number)}
                        {/* <strong>{order.order_number}</strong>
                        <br /> */}
                        <strong>{order.warehouse_town}</strong>
                        <br />
                        {/* <strong>City:</strong> {order.city}
                        <br />
                        <strong>Zipcode:</strong> {order.zipcode}
                        <br /> */}
                        <strong>Placed at:</strong>{" "}
                        {new Date(order.order_time).toLocaleDateString()}
                        <br />
                        <strong>Deliver by:</strong>{" "}
                        {new Date(
                          order.expected_delivery_time
                        ).toLocaleDateString()}
                      </Popup>
                    </Marker>
                  )
              )}

            {vehicleTours.map((vehicle, idx) => {
              const pathColor = colors[idx % colors.length];
              return (
                <React.Fragment key={vehicle.vehicleId}>
                  {vehicle.sections.map((section, secIdx) => (
                    <React.Fragment
                      key={`${vehicle.vehicleId}-section-${secIdx}`}
                    >
                      <Polyline
                        positions={section.coordinates}
                        color={pathColor}
                        weight={4}
                      />
                      <PolylineDecoratorWrapper
                        positions={section.coordinates}
                        color={pathColor}
                      />
                    </React.Fragment>
                  ))}

                  {vehicle.stops.map((stop, sIdx) => {
                    const types = stop.activities.map((a: any) => a.type);
                    const isStartDepot =
                      sIdx === 0 && types.includes("departure");
                    const isLastStop = sIdx === vehicle.stops.length - 1;

                    // Start point > green icon only
                    if (isStartDepot) {
                      return (
                        <Marker
                          key={`stop-${vehicle.vehicleId}-${sIdx}`}
                          position={[stop.location.lat, stop.location.lng]}
                          icon={startIcon}
                        >
                          <Popup>{pinTitle("WMS")}</Popup>
                        </Marker>
                      );
                    }
                    if (isLastStop) return null;
                    // ✅ All other stops → numbered icon (starting from 1)
                    const numberedIcon = L.divIcon({
                      className: "",
                      html: `
                      <div style="
                        background-color: ${pathColor};
                        color: white;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        line-height: 28px;
                        text-align: center;
                        font-weight: bold;
                        border: 2px solid white;
                        box-shadow: 0 0 2px rgba(0,0,0,0.4);
                      ">
                        ${sIdx}
                      </div>
                    `,
                      iconSize: [28, 28],
                      iconAnchor: [14, 28],
                      popupAnchor: [0, -28],
                    });

                    return (
                      <Marker
                        key={`stop-${vehicle.vehicleId}-${sIdx}`}
                        position={[stop.location.lat, stop.location.lng]}
                        icon={numberedIcon}
                      >
                        <Popup>
                          <strong>Stop # {sIdx}</strong>
                          <br />
                          {stop.activities?.[0]?.jobId && (
                            <>
                              Job: {stop.activities[0].jobId}
                              <br />
                            </>
                          )}
                          {stop.time?.arrival && (
                            <>
                              Arrival:{" "}
                              {new Date(stop.time.arrival).toLocaleTimeString()}
                              <br />
                            </>
                          )}
                          {stop.time?.departure && (
                            <>
                              Departure:{" "}
                              {new Date(
                                stop.time.departure
                              ).toLocaleTimeString()}
                            </>
                          )}
                        </Popup>
                      </Marker>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </Box>
      </Box>
    </>
  );
};

export default TourMapPage;

type MapReadyProps = {
  onMapReady: (map: L.Map) => void;
};

const MapReady = ({ onMapReady }: MapReadyProps) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
};
