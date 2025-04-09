import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
// Loading marker icon in Leaflet
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

import { getRoute } from "./graphhopper";
import UpdateMapCenter from "./UpdateMapCenter";

const customIcon = new L.Icon({
  iconUrl: markerIconPng,
  iconSize: [25, 41],
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const markerIconRed = "/marker-icon-red.png";
const redIcon = new L.Icon({
  iconUrl: markerIconRed,
  shadowUrl: markerShadowPng,
  iconSize: [35, 37],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const initialMapCenter = {
  lat: -3.745,
  lng: -38.523,
};

interface Props {
  destination?: [number, number] | null;
}

const LeafletMaps = ({ destination }: Props) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialMapCenter.lat,
    initialMapCenter.lng,
  ]);

  const [route, setRoute] = useState<L.LatLngExpression[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const getLocation = () => {
      // console.log("Navigator: ", navigator);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // console.log("Position Coords: ", position.coords);
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          setMapCenter([latitude, longitude]);

          if (destination) {
            const routeData = await getRoute(
              [latitude, longitude],
              destination
            );
            const routePoints = routeData.points.coordinates.map(
              (point: [number, number]) => [point[1], point[0]]
            );
            setRoute(routePoints);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            console.error("Error fetching location:", error);
          }
          // alert("Unable to retrieve your location");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    getLocation();
  }, [destination]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={20}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
      {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}
      <TileLayer
        url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiemFpbi12ZW5kb21uaWEiLCJhIjoiY204ZmlramFxMGNzazJscHRjNGs5em80NyJ9.1nIfy1EdSPl2cYvwvxOEmA"
        id="mapbox/streets-v11"
        tileSize={512}
        zoomOffset={-1}
        accessToken="pk.eyJ1IjoiemFpbi12ZW5kb21uaWEiLCJhIjoiY204ZmlramFxMGNzazJscHRjNGs5em80NyJ9.1nIfy1EdSPl2cYvwvxOEmA"
      />
      <UpdateMapCenter center={mapCenter} />

      {position && (
        <>
          <Marker position={position} icon={customIcon}>
            <Popup>
              You are here! <br /> {position.join(",")}
            </Popup>
          </Marker>
          {destination && (
            <>
              <Marker position={destination} icon={redIcon}>
                <Popup>
                  Destination <br /> {destination.join(",")}
                </Popup>
              </Marker>
              <Polyline positions={route} color="blue" weight={4} />
            </>
          )}
        </>
      )}
    </MapContainer>
  );
};

export default LeafletMaps;
