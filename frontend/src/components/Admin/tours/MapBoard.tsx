import React, { useEffect, useMemo, useRef } from "react";

import { Backdrop, Box, IconButton } from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import { Geometry, Stop } from "../../../types/tour.type";
import MapboardTourOrder from "../dynamic_tour/MapboardTourOrder";
import PolylineDecoratorWrapper from "../PolylineDecoratorWrapper";
import L from "leaflet";
import { Order } from "../../../types/order.type";
import { pinTitle } from "../dynamic_tour/PinboardOrder";

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

const extractCoords = (tours: Geometry[] | Geometry): [number, number][] => {
  const array = Array.isArray(tours) ? tours : [tours];

  return array.flatMap((v) => [
    ...v.sections.flatMap((s) => s.coordinates),
    ...v.stops.map((s) => [s.location.lat, s.location.lng] as [number, number]),
  ]);
};

const DEFAULT_COLOR = ["blue", "green", "red", "purple", "orange", "brown"];

type MapTourInput = {
  geometry: Geometry;
  color?: string | null;
};
interface Props {
  tours: MapTourInput[];
  focusedTourId?: string | null;
  tourOrders: Order[];
}
const MapBoard = ({ tours, focusedTourId, tourOrders }: Props) => {
  const normalizedTours = useMemo<MapTourInput[]>(() => {
    return tours.map((t, idx) => ({
      geometry: t.geometry,
      color: t.color ?? DEFAULT_COLOR[idx % DEFAULT_COLOR.length],
    }));
  }, [tours]);

  // const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const ordersMap = useMemo(() => {
    const map = new Map<number, Order>();
    tourOrders.forEach((o) => map.set(o.order_id, o));
    return map;
  }, [tourOrders]);

  const mapRef = useRef<L.Map | null>(null);

  const fallbackCoords: [number, number][] = [
    [52.520008, 13.404954], // Berlin Germany
    [50.110924, 8.682127], // Frankfurt Germany
  ];

  const flyToBoundsOptions = {
    padding: [50, 50],
    maxZoom: 8,
    duration: 0.9,
  };

  const boundsCoords = useMemo<[number, number][]>(() => {
    if (!normalizedTours.length) return fallbackCoords;

    if (focusedTourId) {
      const focused = normalizedTours.find(
        (t) => t.geometry.vehicleId === focusedTourId,
      );
      return focused ? extractCoords(focused.geometry) : [];
    }

    return normalizedTours.flatMap((t) => extractCoords(t.geometry));
    // return fallbackCoords;
  }, [normalizedTours, focusedTourId]);

  const bounds = useMemo(() => {
    return L.latLngBounds(boundsCoords);
  }, [boundsCoords]);

  useEffect(() => {
    if (!mapRef.current || !boundsCoords.length) return;

    mapRef.current.flyToBounds(bounds, flyToBoundsOptions as any);
  }, [boundsCoords]);

  const handleRecenter = () => {
    if (!mapRef.current || !boundsCoords.length) return;

    mapRef.current?.flyToBounds(bounds, flyToBoundsOptions as any);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    handleRecenter();
  }, [focusedTourId]);

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={false}
      ></Backdrop>

      {/* Recenter position icon */}
      <Box position="absolute" top={70} right={30} zIndex={1000}>
        <IconButton onClick={handleRecenter}>
          <GpsFixedIcon sx={{ color: "#333", fontSize: 36 }} />
        </IconButton>
      </Box>

      <Box flexGrow={1} position="relative" zIndex={300}>
        <MapContainer
          bounds={bounds}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <MapReady onMapReady={(mapIns) => (mapRef.current = mapIns)} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* {pinboard_OrderList &&
            pinboard_OrderList.map(
              (order) => order && <PinboardOrder orderItem={order} />
            )} */}

          {normalizedTours.map((tour, idx) => {
            const tourCoords = tour.geometry;
            const isFocused = tour.geometry.vehicleId === focusedTourId;
            const pathColor = tour.color ?? DEFAULT_COLOR[2];
            // DEFAULT_COLOR[normalizedTours.length % DEFAULT_COLOR.length];
            const xOrderIds: number[] = [];
            const xOrdersStops = new Map<number, Stop>();

            tourCoords.stops.forEach((stop, sIdx) => {
              const types = stop.activities.map((a: any) => a.type);
              const isStartStop = sIdx === 0 && types.includes("departure");
              const isLastStop = sIdx === tourCoords.stops.length - 1;

              if (isStartStop) return; // Warehouse Stop
              if (isLastStop) return;

              const orderIds = stop.activities
                .flatMap((a) => {
                  if (typeof a.jobId === "string") {
                    const parts = a.jobId.split("_");
                    return parts.length > 1 ? parts[1] : null;
                  }
                  return null;
                })
                .map(Number);

              orderIds.forEach((id) => xOrdersStops.set(id, stop));
              xOrderIds.push(...orderIds);
            });

            const ordersByLocation = new Map<
              string,
              { order: Order; stop: Stop; idx: number }[]
            >();
            xOrderIds.forEach((xOId, idx) => {
              const order_stop = xOrdersStops.get(xOId);
              if (!order_stop) return;
              const order = ordersMap.get(xOId);
              if (!order) return;
              const key = `${order_stop.location.lat.toFixed(6)}-${order_stop.location.lng.toFixed(6)}`;
              const arr = ordersByLocation.get(key) || [];
              arr.push({ order, stop: order_stop, idx });
              ordersByLocation.set(key, arr);
            });

            const polylines = tourCoords.sections.map((section, secIdx) => (
              <React.Fragment key={`${tourCoords.vehicleId}-section-${secIdx}`}>
                <Polyline
                  positions={section.coordinates}
                  color={pathColor}
                  weight={isFocused ? 8 : 4}
                  opacity={isFocused ? 1.2 : 0.9}
                />
                <PolylineDecoratorWrapper
                  positions={section.coordinates}
                  color={pathColor}
                />
              </React.Fragment>
            ));
            const markers = Array.from(ordersByLocation.values()).flatMap(
              (ordersAtSameLocation) =>
                ordersAtSameLocation.map(({ order, stop, idx }, innerIdx) => {
                  const torder = ordersMap.get(order.order_id)!;
                  const adjustedStop = {
                    ...stop,
                    location: {
                      lat: stop.location.lat,
                      lng: stop.location.lng,
                    },
                  };
                  return (
                    <MapboardTourOrder
                      key={`${tourCoords.vehicleId}-${torder.order_id!}-${innerIdx}`}
                      orderItem={torder}
                      stop={adjustedStop}
                      stopNumber={idx + 1}
                      color={pathColor}
                    />
                  );
                }),
            );
            // Warehouse Stop
            const startMarker = tourCoords.stops[0] ? (
              <Marker
                key={`start-${tourCoords.vehicleId + tourCoords.stops.length}`}
                position={[
                  tourCoords.stops[0].location.lat,
                  tourCoords.stops[0].location.lng,
                ]}
                icon={startIcon}
              >
                <Popup>{pinTitle("Warehouse")}</Popup>
              </Marker>
            ) : null;

            return (
              <React.Fragment
                key={
                  "id" + idx + tourCoords.vehicleId + tourCoords.stops.length
                }
              >
                {polylines}
                {startMarker}
                {markers}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </Box>
    </>
  );
};

export default MapBoard;

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
