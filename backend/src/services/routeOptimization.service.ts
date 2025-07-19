import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GRAPH_HOPPER_API_KEY = process.env.GRAPH_HOPPER_API_KEY;
if (!GRAPH_HOPPER_API_KEY) {
  throw new Error('API key not set in .env file');
}

// Helper function to build services
const buildServices = (serviceData: { id: string, lat: number, lon: number }[]) => {
  return serviceData.map(service => ({
    id: service.id,  
    type: "service",  
    address: {
      location_id: service.id,  
      lat: service.lat, 
      lon: service.lon,  
    }
  }));
};

// Helper function to build vehicles
const buildVehicles = (vehicleData: { vehicle_id: string, lat: number, lon: number }[]) => {
  return vehicleData.map(vehicle => ({
    vehicle_id: vehicle.vehicle_id,
    type_id: 'custom_vehicle_type',
    start_address: {
      location_id: vehicle.vehicle_id,  // Vehicle ID for the starting point
      lat: vehicle.lat,  // Vehicle's starting latitude
      lon: vehicle.lon,  // Vehicle's starting longitude
    },
    earliest_start: 1678034512,  // Static start time (could be dynamic if needed)
    return_to_depot: true,  // Assuming vehicles return to depot after routes
  }));
};

// Function to create the Graphhopper request body
const createRouteOptimizationRequest = (
  serviceData: { id: string, lat: number, lon: number }[], 
  vehicleData: { vehicle_id: string, lat: number, lon: number }[]
) => {
  return {
    configuration: {
      routing: {
        calc_points: true,
        return_snapped_waypoints: true,
      },
    },
    objectives: [
      {
        type: 'min',
        value: 'completion_time',  // Optimization goal: minimize completion time
      },
    ],
    vehicles: buildVehicles(vehicleData),  // Vehicle data transformed
    vehicle_types: [
      {
        type_id: 'custom_vehicle_type',
        profile: 'car', 
      },
    ],
    services: buildServices(serviceData),  // Services data transformed
  };
};

export const optimizeRoute = async (
  serviceData: { id: string, lat: number, lon: number }[], 
  vehicleData: { vehicle_id: string, lat: number, lon: number }[]
) => {
  try {
    // Prepare the route optimization request body
    const routeOptimizationRequest = createRouteOptimizationRequest(serviceData, vehicleData);

    // Log the URL and request body for debugging
    const requestUrl = `https://graphhopper.com/api/1/vrp?key=${GRAPH_HOPPER_API_KEY}`;
    console.log('Request URL:', requestUrl); // Logs the full URL
    console.log('Request Body:', JSON.stringify(routeOptimizationRequest, null, 2)); 

    // Call Graphhopper API with the optimization request
    const response = await axios.post(
      requestUrl, 
      routeOptimizationRequest,
      {
        headers: {
          'Content-Type': 'application/json', 
        },
      }
    );

    // Return the response from Graphhopper (contains optimized route data)
    return { data: response.data };
  } catch (error: unknown) {
    // Check if the error is an AxiosError to access response data
    if (axios.isAxiosError(error)) {
      console.error('Error with Graphhopper API:', error.response?.data || error.message);
    } else {
      // General error if it's not an AxiosError
      console.error('Unknown error:', error);
    }
    throw new Error('Failed to optimize route');
  }
};