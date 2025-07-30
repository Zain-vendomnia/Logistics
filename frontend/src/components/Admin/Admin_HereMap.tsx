import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TourData } from "../../types/tour.type";

interface Props {
  tourData: TourData;
}
const Admin_HereMap = ({ tourData }: Props) => {
  // const location = useLocation();
  // const { showNotification } = useNotificationStore();

  // const [tourPayload, setTourPayload] = useState<CreateTour | null>(() => {
  //   const { payload } = location.state || null;
  //   return payload;
  // });
  // console.log("tourPayload Received", tourPayload);

  // const [tourData, setTourData] = useState<TourData | null>(null);

  // useEffect(() => {
  //   if (!tourPayload) {
  //     return showNotification({
  //       message: "Invalid tour data selected.",
  //       severity: NotificationSeverity.Warning,
  //     });
  //   }

  //   const fetchTour = async () => {
  //     try {
  //       const res = await adminApiService.createTour(tourPayload);
  //       // const res = await adminApiService.createtourHereApi(tourPayload);
  //       const rawData = res.data;

  //       console.log("✅ Full API Response:", rawData);

  //       const firstRoute = rawData.routes?.[0];

  //       if (!firstRoute || !Array.isArray(firstRoute.sections)) {
  //         console.error("❌ 'sections' not found in first route:", firstRoute);
  //         return;
  //       }

  //       const polylineCoords: [number, number][] = firstRoute.sections.flatMap(
  //         (section: any) =>
  //           section.coordinates.map((point: any) => [point.lat, point.lng])
  //       );

  //       const stops: Stop[] = firstRoute.stops || [];

  //       setTourData({
  //         routePolyline: polylineCoords,
  //         stops,
  //       });
  //     } catch (err) {
  //       console.error("Create tour API call failed", err);
  //     }
  //   };

  //   fetchTour();
  // }, []);

  useEffect(() => {
    console.log("TourData received in Maps: ", tourData);
  }, []);

  return (
    <div>
      <MapContainer
        bounds={L.latLngBounds(tourData.routePolyline)}
        zoom={13}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {tourData.routePolyline?.length > 0 && (
          <Polyline positions={tourData.routePolyline} color="blue" />
        )}

        {tourData.stops.map((stop, idx) => (
          <Marker
            key={idx}
            position={[stop.location.lat, stop.location.lng]}
            icon={L.icon({
              iconUrl:
                "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <strong>Stop {idx + 1}</strong>
              <br />
              {stop.activities?.[0]?.jobId &&
                `Job: ${stop.activities[0].jobId}`}
              <br />
              {stop.time?.arrival &&
                `Arrival: ${new Date(stop.time.arrival).toLocaleTimeString()}`}
              <br />
              {stop.time?.departure &&
                `Departure: ${new Date(stop.time.departure).toLocaleTimeString()}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Admin_HereMap;
