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

const deleteTours = (tourIds: number[]) => {
  return axios.delete(API_BaseUrl + "deleteTours", {
    headers: authHeader(),
    data: { tourIds } // Send IDs in the request body
  });
};
// Add this to your existing adminApiService
const exportTours = (tourIds: number[] | string[]) => {
  return axios.post(API_BaseUrl + "exportTours", 
    { tourIds }, 
    { headers: authHeader() }
  );
};

// Update your export default at the bottom to include this
 
export default {
  fetchRouteData,
  fetchOrderTourCount,
  fetchAllTours,
  fetchOrderCount,
  fetchAllOrders,
  createTour,
<<<<<<< HEAD
  getRouteResponse,
=======
  deleteTours,
  exportTours
>>>>>>> 3a348fd879a83a2bb9a5b7470d9c18bf37c2d89b
};
