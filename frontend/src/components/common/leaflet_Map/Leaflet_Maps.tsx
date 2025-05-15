import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet";

interface Props {
  destination: [number, number] | null;
  routePath: LatLngTuple[];
}
const LeafletMaps: React.FC<Props> = ({ destination, routePath }) => {
  const position: [number, number] = [25.1972, 55.2744]; // Default or use your start position

  return (
    <MapContainer center={position} zoom={6} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Polyline for the route */}
      {routePath.length > 0 && (
     <Polyline positions={routePath} color="blue" />
      )}

      {/* Destination marker */}
      {destination && (
        <Marker position={destination}>
          <Popup>Destination</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default LeafletMaps;
