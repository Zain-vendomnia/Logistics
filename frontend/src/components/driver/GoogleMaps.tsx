import { useState, useEffect, useRef } from "react";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBP2Ij-7iyGs46fzSnRVipyg1_QMaznZJU";
const MAP_ID = "YOUR_MAP_ID_HERE";
const LIBRARIES: "marker"[] = ["marker"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "8px",
};

const mapCenter = {
  lat: -3.745,
  lng: -38.523,
};

const GoogleMaps = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pinLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(pinLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [location]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    if (google && google.maps.marker && mapRef.current) {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: location,
        map: mapRef.current,
        title: "Your are here",
      });
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={location || mapCenter}
        zoom={15}
        // mapId={MAP_ID}
        onLoad={onLoad}
      >
        {location && <Marker position={location} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMaps;
