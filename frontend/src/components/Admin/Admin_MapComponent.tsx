import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import adminApiService from '../../services/adminApiService';
import axios from 'axios';

const RouteMap = () => {
  const [routePoints, setRoutePoints] = useState<[number, number][][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRouteData = async () => {
    try {
      const response = await adminApiService.fetchRouteData();  // Call the service method
      const data = response.data;  // Axios response has data in the 'data' property
      console.log("API response:", data);
  
      if (data && data.solution && data.solution.routes.length > 0) {
        const routes = data.solution.routes[0].points;
        console.log("Route points:", routes);
  
        const formattedRoutes = routes.map((route: { coordinates: [any, any][] }) => {
          return route.coordinates.map(([lon, lat]) => [lat, lon]);
        });
  
        setRoutePoints(formattedRoutes);
      }
  
      setLoading(false);  // Set loading to false after the data is fetched
    } catch (error) {
      setLoading(false);  // Ensure loading is set to false if there is an error
      console.error("Error fetching route data:", error);
  
      // Handle different types of error responses:
      if (axios.isAxiosError(error)) {
        // Handle axios-specific errors (e.g., network errors, response errors)
        if (error.response) {
          // The request was made, but the server responded with an error code
          console.error("Server responded with an error:", error.response.data);
          alert(`Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          // The request was made, but no response was received
          console.error("No response received:", error.request);
          alert("Network error: No response received from the server.");
        } else {
          // Other errors (e.g., bad configuration)
          console.error("Error in setting up the request:", error.message);
          alert(`Error: ${error.message}`);
        }
      } else {
        // Non-axios errors (unexpected errors)
        alert("An unexpected error occurred while fetching the route data.");
      }
    }
  };
  

  useEffect(() => {
    fetchRouteData();
  }, []);

  if (loading) {
    return <div>Loading route data...</div>;
  }

  // Create a custom marker icon
  const customIcon = new L.Icon({
    iconUrl: '/images/location-pin.png', // Path to your PNG icon
    iconSize: [32, 32], // Size of the icon (width, height)
    iconAnchor: [16, 32], // Anchor position (sets the base of the marker to this point)
    popupAnchor: [0, -32], // Popup position relative to the marker
  });

  return (
    <div>
      <h2>Optimized Route</h2>
      <MapContainer
        center={[51.19156615, 10.00519040096668]} // Default center point for map (start location)
        zoom={10}
        style={{ height: "700px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {routePoints.length > 0 &&
          routePoints.map((route, index) => (
            <React.Fragment key={index}>
              {/* Render the Polyline */}
              <Polyline
                positions={route}
                color="Navy"
                weight={5}
                opacity={0.7}
              />

              {/* Only render a marker at the first and last point of the route */}
              {route.length > 0 && (
                <>
                  {/* Start marker with custom icon */}
                  <Marker position={route[0]} key={`start-${index}`} icon={customIcon}>
                    <Popup>
                      Start Point: {`Lat: ${route[0][0]}, Lon: ${route[0][1]}`}
                    </Popup>
                  </Marker>

                  {/* End marker with custom icon */}
                  <Marker position={route[route.length - 1]} key={`end-${index}`} icon={customIcon}>
                    <Popup>
                      End Point: {`Lat: ${route[route.length - 1][0]}, Lon: ${route[route.length - 1][1]}`}
                    </Popup>
                  </Marker>
                </>
              )}
            </React.Fragment>
          ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
