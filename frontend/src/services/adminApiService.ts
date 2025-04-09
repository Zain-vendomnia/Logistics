// adminApiService.ts
import axios from 'axios';
import authHeader from './auth-header'; 

const API_URL = "http://localhost:8080/api/admin/route/";

// Fetch route data for optimization
const fetchRouteData = () => {
  return axios.get(API_URL + "optimize", { headers: authHeader() });
};

// You can add more methods here as needed for different API calls
const fetchRouteHistory = () => {
  return axios.get(API_URL + "history", { headers: authHeader() });
};

const fetchRouteDetails = (params: { routeId: number }) => {
  return axios.get(API_URL + "details", { headers: authHeader(), params });
};

export default {
  fetchRouteData,
  fetchRouteHistory,
  fetchRouteDetails,
};
