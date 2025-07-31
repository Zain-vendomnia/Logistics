import { useEffect } from "react";
import { Box } from "@mui/material";
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
const MapRoutesViewer = ({ tourData }: Props) => {
  useEffect(() => {
    console.log("TourData MapRoutesViewer: ", tourData);
  }, []);

  return (
    <Box>
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
    </Box>
  );
};

export default MapRoutesViewer;
