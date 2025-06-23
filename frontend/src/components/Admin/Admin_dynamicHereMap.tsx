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
import polyline from "@mapbox/polyline";
import { useLocation } from "react-router-dom";

interface Stop {
    location: { lat: number; lng: number };
    time: { arrival: string; departure: string };
    activities: { jobId: string; type: string }[];
}

interface TourData {
    routePolyline: [number, number][];
    stops: Stop[];
}

const Dashboard: React.FC = () => {
    const [tourData, setTourData] = useState<TourData | null>(null);

    useEffect(() => {
        const fetchTour = async () => {
            try {
                const res = await adminApiService.plotheremap();
                const rawData = res.data;

                //Flatten coordinates from all sections into a single array
                const allCoordinates = rawData.sections.flatMap((section: any) =>
                    section.coordinates.map((coord: any) => [coord.lat, coord.lng])
                );
                const polylineCoords: [number, number][] = rawData.sections.flatMap(
                    (section: any) =>
                        section.coordinates.map((point: any) => [point.lat, point.lng])
                );

                 const tour: TourData = {
                   routePolyline: allCoordinates, 
                   stops: [], 
                 };
                const stops: Stop[] = rawData.stops;
                setTourData({
                    routePolyline: polylineCoords,
                    stops,
                });
                //  setTourData(tour);
            } catch (err) {
                console.error("API call failed", err);
            }
        };

        fetchTour();
    }, []);

    return (
        <div>
            <h2>Tour Planner Map</h2>

            {!tourData ? (
                <p>Loading tour...</p>
            ) : (
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
                                <strong>Stop {idx + 1}</strong><br />
                                {stop.activities?.[0]?.jobId && `Job: ${stop.activities[0].jobId}`}<br />
                                {stop.time?.arrival && `Arrival: ${new Date(stop.time.arrival).toLocaleTimeString()}`}<br />
                                {stop.time?.departure && `Departure: ${new Date(stop.time.departure).toLocaleTimeString()}`}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            )}
        </div>
    );
};

export default Dashboard;
