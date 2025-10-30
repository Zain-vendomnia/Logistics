import React, { useEffect, useRef, useState } from "react";

import { Box, IconButton } from "@mui/material";
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
import useLiveDTourUpdates from "../../../socket/useLiveDTourUpdates";
import PinboardOrder, { pinTitle } from "./PinboardOrder";
import MapboardTourOrder from "./MapboardTourOrder";

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

const extract_Coords = (tours: Geometry[] | Geometry): [number, number][] => {
  const array = Array.isArray(tours) ? tours : [tours];

  return array.flatMap((v) => [
    ...v.sections.flatMap((s) => s.coordinates),
    ...v.stops.map((s) => [s.location.lat, s.location.lng] as [number, number]),
  ]);
};

const colors = ["blue", "green", "red", "purple", "orange", "brown"];

const DymanicMapBoard = () => {
  const mapRef = useRef<L.Map | null>(null);
  const focusedTourIdRef = useRef<string | null>(null);

  const {
    pinboard_OrderList,
    lastFetchedAt,
    pinboard_AddOrders,
    pinboard_removeOrders,
    selectedTour,
    dynamicToursList,
    setDynamicToursList,
    updateDynamicToursList,
    dtoursOrders,
    updateDToursOrders,
    removeDToursOrders,
  } = useDynamicTourStore();

  useLiveOrderUpdates((new_order) => {
    console.log(
      `[${new Date().toLocaleTimeString()}] - New Pin-Board Order: `,
      new_order
    );
    pinboard_AddOrders([new_order]);
  });

  useLiveDTourUpdates((dTour: DynamicTourPayload) => {
    console.log(
      `[${new Date().toLocaleTimeString()}] - New Dynamic Tour: `,
      dTour.tour_name
    );
    updateDynamicToursList(dTour);
    setVehicleTours((prev) =>
      dTour.tour_route ? [...prev, dTour.tour_route as Geometry] : prev
    );
    pinboard_removeOrders(dTour.orderIds.split(",").map(Number));
  });

  const [vehicleTours, setVehicleTours] = useState<Geometry[]>([]);
  const [tourOrdersMap, setTourOrdersMap] = useState<Map<number, Order>>(
    new Map()
  );

  const [isLoading, setIsLoading] = useState<boolean>(
    vehicleTours.length === 0
  );

  const fallbackCoords: [number, number][] = [
    [52.520008, 13.404954], // Berlin Germany
    [50.110924, 8.682127], // Frankfurt Germany
  ];
  let allCoords: [number, number][] = fallbackCoords;

  const flyToBoundsOptions = {
    padding: [50, 50],
    maxZoom: 15,
    duration: 0.9,
  };

  // Fetch Dynamic Tours
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const dynamic_tours = await adminApiService.fetchDynamicTours();
        console.log("Received Dynamic Tours API:", dynamic_tours);

        const tours_route: Geometry[] = dynamic_tours.flatMap(
          (tour: DynamicTourPayload) => tour.tour_route || []
        );
        // console.log("[Test]: tours_route", tours_route);

        setDynamicToursList(dynamic_tours as DynamicTourPayload[]);
        setVehicleTours(tours_route);

        const dToursOrdersIds = dynamic_tours
          .flatMap((dtour) => dtour.orderIds)
          .join(",");
        pinboard_removeOrders(dToursOrdersIds.split(",").map(Number));
      } catch (err) {
        console.error("API call failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  useEffect(() => {
    const tourOrders = async () => {
      if (!dynamicToursList.length) return;

      const allOrdersIds = dynamicToursList
        .flatMap((t) => t.orderIds.split(","))
        .map(Number);

      const persistedOrders = dtoursOrders;
      const persistedMap = new Map(persistedOrders.map((o) => [o.order_id, o]));
      // debugger;
      const missingIds = allOrdersIds.filter((id) => !persistedMap.has(id));

      let fetchedOrders: Order[] = [];

      if (missingIds.length) {
        console.log("[DTours] Fetching missing orders from API:", missingIds);
        fetchedOrders = await adminApiService.fetchOrdersWithItems(
          missingIds.join(",")
        );

        updateDToursOrders(fetchedOrders);
      }

      const allOrdersMap = new Map<number, Order>(persistedMap);
      fetchedOrders.forEach((o) => allOrdersMap.set(o.order_id, o));

      setTourOrdersMap(allOrdersMap);

      // const extraOrdersIds = Array.from(persistedMap.keys()).filter(
      //   (id) => !allOrdersIds.includes(id)
      // );
      // if (extraOrdersIds.length) {
      //   removeDToursOrders(extraOrdersIds);
      // }
    };

    tourOrders();
  }, [dynamicToursList]);

  // mapRef to all tours
  useEffect(() => {
    if (!mapRef.current) return;

    if (
      !isLoading &&
      vehicleTours.length > 0 &&
      focusedTourIdRef.current === null
    ) {
      allCoords = extract_Coords(vehicleTours);
      const bounds = L.latLngBounds(allCoords);
      mapRef.current.flyToBounds(bounds, flyToBoundsOptions as any);

      // setTimeout(() => {
      //   mapRef.current?.setZoom(mapRef.current.getZoom() - 1); // zoom out 1 level
      // }, 1600);
    }
    // }, []);
  }, [isLoading, vehicleTours]);

  // mapRef to selected tour
  useEffect(() => {
    if (!selectedTour || !selectedTour.tour_route || !mapRef.current) return;
    // console.log("[Test]:", selectedTour);

    setVehicleTours((prev) =>
      prev.map((route) =>
        route.vehicleId === selectedTour.tour_route?.vehicleId
          ? selectedTour.tour_route
          : route
      )
    );

    // if (focusedTourIdRef.current !== selectedTour.tour_route.vehicleId) {
    focusedTourIdRef.current = selectedTour.tour_route.vehicleId;

    allCoords = extract_Coords(selectedTour.tour_route);
    const bounds = L.latLngBounds(allCoords);
    mapRef.current.flyToBounds(bounds, flyToBoundsOptions as any);
    console.log(`Updating Map ref for Selected Tour`);
    // }
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
        const asd = pinboard_OrderList[0];
        console.log("pinboard_OrderList obj", asd);
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
  }, [pinboard_OrderList.length, lastFetchedAt]);

  const handleReposition = () => {
    if (mapRef.current) {
      const infocus = selectedTour ? selectedTour.tour_route! : vehicleTours;
      allCoords = extract_Coords(infocus);
      const bounds = L.latLngBounds(allCoords);

      mapRef.current?.flyToBounds(bounds, flyToBoundsOptions as any);
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
        <DynamicTourList />

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

            {pinboard_OrderList &&
              pinboard_OrderList.map(
                (order) => order && <PinboardOrder orderItem={order} />
              )}

            {vehicleTours.map((vehicle, idx) => {
              const dtour_orderIds: number[] = [];
              const orderStop_Map = new Map<number, Stop>();
              const pathColor = colors[idx % colors.length];
              const isFocused = focusedTourIdRef.current === vehicle.vehicleId;

              vehicle.stops.forEach((stop, sIdx) => {
                const types = stop.activities.map((a: any) => a.type);
                const isStartStop = sIdx === 0 && types.includes("departure");
                const isLastStop = sIdx === vehicle.stops.length - 1;

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

                orderIds.forEach((id) => orderStop_Map.set(id, stop));
                dtour_orderIds.push(...orderIds);
              });

              const ordersByLocation = new Map<
                string,
                { order: Order; stop: Stop; idx: number }[]
              >();
              dtour_orderIds.forEach((id, idx) => {
                const order_stop = orderStop_Map.get(id);
                if (!order_stop) return;
                const order = tourOrdersMap.get(id);
                if (!order) return;
                const key = `${order_stop.location.lat.toFixed(6)}-${order_stop.location.lng.toFixed(6)}`;
                const arr = ordersByLocation.get(key) || [];
                arr.push({ order, stop: order_stop, idx });
                ordersByLocation.set(key, arr);
              });

              const polylines = vehicle.sections.map((section, secIdx) => (
                <React.Fragment key={`${vehicle.vehicleId}-section-${secIdx}`}>
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
                    const torder = tourOrdersMap.get(order.order_id)!;
                    const adjustedStop = {
                      ...stop,
                      location: {
                        lat: stop.location.lat,
                        lng: stop.location.lng,
                      },
                    };
                    return (
                      <MapboardTourOrder
                        key={`${vehicle.vehicleId}-${torder.order_id!}-${innerIdx}`}
                        orderItem={torder}
                        stop={adjustedStop}
                        stopNumber={idx + 1}
                        color={pathColor}
                      />
                    );
                  })
              );
              // Warehouse Stop
              const startMarker = vehicle.stops[0] ? (
                <Marker
                  key={`start-${vehicle.vehicleId}`}
                  position={[
                    vehicle.stops[0].location.lat,
                    vehicle.stops[0].location.lng,
                  ]}
                  icon={startIcon}
                >
                  <Popup>{pinTitle("Warehouse")}</Popup>
                </Marker>
              ) : null;

              return (
                <React.Fragment key={vehicle.vehicleId}>
                  {polylines}
                  {startMarker}
                  {markers}
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
