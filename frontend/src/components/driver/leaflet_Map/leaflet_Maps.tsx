import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

// Loading missing default marker icon in Leaflet
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const initialMapCenter = {
  lat: -3.745,
  lng: -38.523,
};

const UpdateMapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  console.log("map center:", map.getCenter());

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LeafletMaps = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialMapCenter.lat,
    initialMapCenter.lng,
  ]);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // console.log("Position Coords: ", position.coords);
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("Unable to retrieve your location");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    getLocation();
  }, []);

  return (
    <MapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <UpdateMapCenter center={mapCenter} />

      {position && (
        <>
          <Marker position={position} icon={customIcon}>
            <Popup>
              You are here! <br /> {position.join(",")}
            </Popup>
          </Marker>
        </>
      )}

    </MapContainer>
  );
};

export default LeafletMaps;
