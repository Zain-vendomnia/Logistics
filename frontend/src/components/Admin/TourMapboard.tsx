import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography, Modal, Button } from "@mui/material";
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
import { TourPayload, Geometry, Stop } from "../../types/tour.type";
import useTourStore from "../../store/useTourStore";
import adminApiService from "../../services/adminApiService";
import { Order } from "../../types/order.type";
import { TourOrdersList } from "./tour/TourOrdersList";
import { useParams } from "react-router-dom";


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

const getStopIcon = (stop: Stop) => {
  const types = stop.activities.map((a) => a.type);
  if (types.includes("departure") && types.includes("arrival"))
    return depotIcon;
  if (types.includes("departure")) return startIcon;
  if (types.includes("arrival")) return endIcon;
  return defaultIcon;
};
const extract_Coords = (tours: Geometry[] | Geometry): [number, number][] => {
  const array = Array.isArray(tours) ? tours : [tours];

  return array.flatMap((v) => [
    ...v.sections.flatMap((s) => s.coordinates),
    ...v.stops.map((s) => [s.location.lat, s.location.lng] as [number, number]),
  ]);
};
const colors = ["red", "purple", "orange", "brown"];
const fallbackCoords: [number, number][] = [
  [52.520008, 13.404954]
];
let allCoords: [number, number][] = fallbackCoords;

const flyToBoundsOptions = {
  padding: [50, 50],
  maxZoom: 15,
  duration: 1.5,
};




const TourMapboard = () => {
  const { tour_id } = useParams<{ tour_id: string }>();
  const mapRef = useRef<L.Map | null>(null);
  const focusedTourIdRef = useRef<string | null>(null);

const {toursList} =  useTourStore();

  const [tour, setTour] = useState<TourPayload>();
  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [tourRoutes, setTourRoutes] = useState<Geometry>();
  const [isLoading, setIsLoading] = useState<boolean>(false);


  useEffect(() => {

    if (!tour_id) return;
    
    const fetchTour = async () => {
      const tourResp = await adminApiService.getRouteResponse(Number(tour_id));
      const single_tour = tourResp.data;
      // const tour00 = await adminApiService.fetchTourDetails(tourId)
      setTour(single_tour[0]);

         const orders: Order[] =
          await adminApiService.fetchOrdersWithItems(single_tour[0].orderIds);
        setTourOrders(orders);

    }

    fetchTour()
  }, [])
 
  useEffect(() => {

    if(!tour) return;

    tour.tour_route && setTourRoutes(tour.tour_route);


  }, [tour]);


  if (!tour || !tour.tour_route) {
    return null; // or skip this section until data exists
  }

  const allCoords = extract_Coords(tour.tour_route);

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
  
  const pathColor = colors[10 % colors.length];



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
       {tourOrders && (
          <TourOrdersList
            orders={tourOrders}
          />
        )}

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
          <MapContainer
            bounds={L.latLngBounds(allCoords)}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <MapReady
              onMapReady={(mapInstance) => (mapRef.current = mapInstance)}
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
              {tourRoutes &&
              <React.Fragment>
                {tourRoutes.sections.map((section, secIdx) => (
                  <React.Fragment
                    key={`${tourRoutes.vehicleId}-section-${secIdx}`}
                  >
                    <Polyline
                      positions={section.coordinates}
                      color={pathColor}
                      weight={8}
                      opacity={1}
                    />
                    <PolylineDecoratorWrapper
                      positions={section.coordinates}
                      color={pathColor}
                    />
                  </React.Fragment>
                ))}

                {tourRoutes.stops.map((stop, sIdx) => {
                  const types = stop.activities.map((a: any) => a.type);
                  const isStartDepot =
                    sIdx === 0 && types.includes("departure");
                  const isLastStop = sIdx === tourRoutes.stops.length - 1;

                  // Start point > green icon only
                  if (isStartDepot) {
                    return (
                      <Marker
                        key={`stop-${tourRoutes.vehicleId}-${sIdx}`}
                        position={[stop.location.lat, stop.location.lng]}
                        icon={startIcon}
                      >
                        <Popup>{pinTitle("WMS")}</Popup>
                      </Marker>
                    );
                  }
                  if (isLastStop) return null;

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
                      key={`stop-${tourRoutes.vehicleId}-${sIdx}`}
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
              </React.Fragment>}
          </MapContainer>

        </Box>
      </Box>


    </>
  );
};

export default TourMapboard;

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
