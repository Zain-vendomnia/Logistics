import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import adminApiService from "../../services/adminApiService";

interface Stop {
  location: { lat: number; lng: number };
  time: { arrival: string; departure: string };
  activities: { jobId: string; type: string }[];
}

interface RouteSection {
  coordinates: [number, number][];
  summary: any;
}

interface VehicleTour {
  vehicleId: string;
  sections: RouteSection[];
  stops: Stop[];
}

const Dashboard: React.FC = () => {
  const [vehicleTours, setVehicleTours] = useState<VehicleTour[]>([]);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await adminApiService.plotheremap(); 
        const rawData = res.data.routes;

        const tours: VehicleTour[] = rawData.map((vehicle: any) => ({
          vehicleId: vehicle.vehicleId,
          sections: vehicle.sections.map((section: any) => ({
            summary: section.summary,
            coordinates: section.coordinates.map((pt: any) => [
              pt.lat,
              pt.lng,
            ]),
          })),
          stops: vehicle.stops,
        }));

        setVehicleTours(tours);
      } catch (err) {
        console.error("API call failed", err);
      }
    };

    fetchTours();
  }, []);

  // Collect all coordinates for setting map bounds
  const allCoords = vehicleTours.flatMap((v) =>
    v.sections.flatMap((s) => s.coordinates)
  );

  const colors = ["blue", "green", "red", "purple", "orange", "brown"];

  return (
    <div>
      <h2>Tour Planner Map</h2>

      {vehicleTours.length === 0 ? (
        <p>Loading tours...</p>
      ) : (
        <MapContainer
          bounds={L.latLngBounds(allCoords)}
          zoom={13}
          style={{ height: "600px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {vehicleTours.map((vehicle, idx) => (
            <React.Fragment key={vehicle.vehicleId}>
              {/* Route Polyline */}
              {vehicle.sections.map((section, secIdx) => (
                <Polyline
                  key={`${vehicle.vehicleId}-section-${secIdx}`}
                  positions={section.coordinates}
                  color={colors[idx % colors.length]}
                  weight={4}
                />
              ))}

              {/* Stop Markers */}
              {vehicle.stops.map((stop, sIdx) => (
                <Marker
                  key={`${vehicle.vehicleId}-stop-${sIdx}`}
                  position={[stop.location.lat, stop.location.lng]}
                  icon={L.icon({
                    iconUrl:
                      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                >
                  <Popup>
                    <strong>Vehicle:</strong> {vehicle.vehicleId}
                    <br />
                    <strong>Stop {sIdx + 1}</strong>
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
                        {new Date(stop.time.departure).toLocaleTimeString()}
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
            </React.Fragment>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default Dashboard;
