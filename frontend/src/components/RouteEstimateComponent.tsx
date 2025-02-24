import React, { useState } from "react";
import axios from "axios";

interface RouteEstimate {
  // Define the structure based on the expected response from your API
  estimatedTime: string;
  distance: string;
  cost: string;
}

const RouteEstimateComponent: React.FC = () => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRouteEstimate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/admin/estimate", { origin, destination });
      setRouteEstimate(response.data); 
    } catch (err) {
      setError("Unable to fetch route estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Route Estimate</h1>
      <input
        type="text"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        placeholder="Enter origin"
      />
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Enter destination"
      />
      <button onClick={fetchRouteEstimate} disabled={loading}>
        {loading ? "Loading..." : "Get Estimate"}
      </button>

      {error && <p>{error}</p>}

      {routeEstimate && (
        <div>
          <h3>Route Estimate</h3>
          <p>Estimated Time: {routeEstimate.estimatedTime}</p>
          <p>Distance: {routeEstimate.distance}</p>
          <p>Cost: {routeEstimate.cost}</p>
        </div>
      )}
    </div>
  );
};

export default RouteEstimateComponent;
