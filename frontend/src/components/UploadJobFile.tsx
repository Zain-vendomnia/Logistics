// src/components/UploadJobFile.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import adminApiService from "../services/adminApiService";
import L from 'leaflet';
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography } from "@mui/material";
import PolylineDecoratorWrapper from './Admin/PolylineDecoratorWrapper';

const UploadJobFile: React.FC = () => {
    const [vehicleTours, setVehicleTours] = useState<VehicleTour[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
    const allCoords = vehicleTours.flatMap((v) => [
        ...v.sections.flatMap((s) => s.coordinates),
        ...v.stops.map((s) => [s.location.lat, s.location.lng] as [number, number]),
    ]);

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
    const colors = ["blue", "green", "red", "purple", "orange", "brown"];
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        setResponse(null);
        setError(null);
    };
    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            setLoading(true);
            const res = await adminApiService.uploadexcel(formData);
            setResponse(res.data);
            const rawData = res.data.routes;
            // console.log("rawData" + JSON.stringify(rawData));
            const tours: VehicleTour[] = rawData.map((vehicle: any) => ({
                vehicleId: vehicle.vehicleId,
                sections: vehicle.sections.map((section: any) => ({
                    summary: section.summary,
                    coordinates: section.coordinates.map((pt: any) => [pt.lat, pt.lng]),
                })),
                stops: vehicle.stops,
            }));

            setVehicleTours(tours);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Upload failed.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ padding: 20 }}>
            <h2> Upload Excel Job List </h2>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={loading || !file}>
                {loading ? 'Uploading...' : 'Upload and Plan'}
            </button>
            {error && (
                <div style={{ color: 'red' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            <Box display="flex" height="100vh">
                {/* Right Map */}
                <Box flexGrow={1}>
                    {vehicleTours.length === 0 ? (
                        <Typography variant="body2" p={2}>
                            Loading tours...
                        </Typography>
                    ) : (
                        <MapContainer
                            bounds={L.latLngBounds(allCoords)}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {vehicleTours.map((vehicle, idx) => (
                                <React.Fragment key={vehicle.vehicleId}>
                                    {vehicle.sections.map((section, secIdx) => (
                                        <React.Fragment key={`${vehicle.vehicleId}-section-${secIdx}`}>
                                            <Polyline
                                                positions={section.coordinates}
                                                color={colors[idx % colors.length]}
                                                weight={4}
                                            />
                                            <PolylineDecoratorWrapper
                                                positions={section.coordinates}
                                                color={colors[idx % colors.length]}
                                            />
                                        </React.Fragment>
                                    ))}

                                    {vehicle.stops.map((stop, sIdx) => {
                                        const types = stop.activities.map((a: any) => a.type);
                                        const isStartDepot = sIdx === 0 && types.includes("departure");
                                        const isLastStop = sIdx === vehicle.stops.length - 1;

                                        // ✅ Start depot → green icon only
                                        if (isStartDepot) {
                                            return (
                                                <Marker
                                                    key={`stop-${vehicle.vehicleId}-${sIdx}`}
                                                    position={[stop.location.lat, stop.location.lng]}
                                                    icon={startIcon}
                                                >
                                                    <Popup>
                                                        <strong>Start Depot</strong>
                                                        <br />
                                                        Vehicle: {vehicle.vehicleId}
                                                    </Popup>
                                                </Marker>
                                            );
                                        }
                                        if (isLastStop) return null;
                                        // ✅ All other stops → numbered icon (starting from 1)
                                        const numberedIcon = L.divIcon({
                                            className: "",
                                                 html: `
                                                    <div style="
                                                        background-color: #1976d2;
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
                                                    <strong>Vehicle:</strong> {vehicle.vehicleId}
                                                    <br />
                                                    <strong>Stop ${sIdx}</strong>
                                                    <br />
                                                    {stop.activities?.[0]?.jobId && (
                                                        <>
                                                            Job: {stop.activities[0].jobId}
                                                            <br />
                                                        </>
                                                    )}
                                                    {stop.time?.arrival && (
                                                        <>
                                                            Arrival: {new Date(stop.time.arrival).toLocaleTimeString()}
                                                            <br />
                                                        </>
                                                    )}
                                                    {stop.time?.departure && (
                                                        <>
                                                            Departure: {new Date(stop.time.departure).toLocaleTimeString()}
                                                        </>
                                                    )}
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </MapContainer>
                    )}
                </Box>
            </Box>
        </div>
    );
};

export default UploadJobFile;
