import React, { useEffect, useRef, useState } from "react";

import { Box, IconButton, Typography } from "@mui/material";
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

import PolylineDecoratorWrapper from "../PolylineDecoratorWrapper";
import adminApiService from "../../../services/adminApiService";
import { DynamicTourPayload, Geometry, Stop } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import useLiveOrderUpdates from "../../../socket/useLiveOrderUpdates";
import DynamicTourList from "./DynamicTourList";
import DynamicTourDetails from "./DynamicTourDetails";
import { Order } from "../../../types/order.type";

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

const DymanicMapBoard = () => {
  const mapRef = useRef<L.Map | null>(null);

  const {
    pinboard_OrderList,
    lastFetchedAt,
    pinboard_AddOrders,
    selectedTour,
    dynamicTours,
    setDynamicTours,
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
        setDynamicTours(dynamic_tours as DynamicTourPayload[]);
        setVehicleTours(tours_route);
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
        console.log(`isStale: ${isStale}`);
        console.log(`pinboard_OrderList.length: ${pinboard_OrderList.length}`);
        if (pinboard_OrderList.length === 0 || isStale) {
          const orders: Order[] =
            await adminApiService.fetchPinboardOrders(lastFetchedAt);

          console.error("Pin-b Orders: ", orders);

          if (orders.length) {
            const existingIds = new Set(
              pinboard_OrderList.map((o) => o.order_id)
            );
            const newOrders = orders.filter(
              (o) => !existingIds.has(o.order_id)
            );
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
          {selectedTour && <DynamicTourDetails />}
        </Box>
      </Box>
    </>
  );
};

export default DymanicMapBoard;

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
