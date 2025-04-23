// adminApiService.ts
import axios from 'axios';
import authHeader from './auth-header'; 

const API_BaseUrl = "http://localhost:8080/api/admin/routeoptimize/";

// Fetch route data for optimization
const fetchRouteData = () => {
  return axios.get(API_BaseUrl + "optimize", { headers: authHeader() });
};

const fetchOrderTourCount = () => {
  return axios.get(API_BaseUrl + "tourcount", { headers: authHeader() });
};

const fetchAllTours = () => {
  return axios.get(API_BaseUrl + "getAlltours", { headers: authHeader() });
};

const fetchOrderCount = () => {
  return axios.get(API_BaseUrl + "ordercount", { headers: authHeader() });
};

const fetchAllOrders = () => {
  return axios.get(API_BaseUrl + "orders", { headers: authHeader() });
};

const createTour = (tourData: any) => {
  return axios.post(API_BaseUrl + "createtour", tourData, { headers: authHeader(), });
};

const getRouteResponse = (tour_id: number) => {
  return axios.post(API_BaseUrl + "getGraphhopperRoute", { tour_id }, { headers: authHeader() });
};

/* const createtour = (params: { routeId: number }) => {
  return axios.get(API_BaseUrl + "details", { headers: authHeader(), params });
}; */
 
export default {
  fetchRouteData,
  fetchOrderTourCount,
  fetchAllTours,
  fetchOrderCount,
  fetchAllOrders,
  createTour,
  getRouteResponse,
};
