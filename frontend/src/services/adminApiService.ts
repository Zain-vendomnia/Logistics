// adminApiService.ts
import axios from 'axios';
import authHeader from './auth-header';

const API_BaseUrl = "http://localhost:8080/api/admin/routeoptimize/";

// Regular API calls using routeoptimize base
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
  return axios.post(API_BaseUrl + "createtour", tourData, {
    headers: authHeader(),
  });
};

const getRouteResponse = (tour_id: number) => {
  return axios.post(API_BaseUrl + "getGraphhopperRoute", { tour_id }, {
    headers: authHeader(),
  });
};

const deleteTours = (tourIds: number[]) => {
  return axios.delete(API_BaseUrl + "deleteTours", {
    headers: authHeader(),
    data: { tourIds },
  });
};

const exportTours = (tourIds: number[] | string[]) => {
  return axios.post(API_BaseUrl + "exportTours", { tourIds }, {
    headers: authHeader(),
  });
};
const fetchRouteSegmentData  = (tour_id: number) => {
  return axios.post(API_BaseUrl + "getSegmentRoute", { tour_id }, { headers: authHeader() });
};

const updateTour = (tourData: any) => {
  return axios.put(API_BaseUrl + "updateTour", tourData, {
    headers: authHeader(),
  });
};

// ⬇️ This is outside the routeoptimize scope — it has its own endpoint
const getOrderCount = async (): Promise<number> => {
  try {
    const response = await axios.get<{ ordersCount: number }>(
      'http://localhost:8080/api/admin/orderCount'
    );
    return response.data.ordersCount;
  } catch (error) {
    console.error('Error fetching order count:', error);
    throw new Error('Failed to fetch order count');
  }
};

// Export all as named members under default
const adminApiService = {
  fetchRouteData,
  fetchOrderTourCount,
  fetchAllTours,
  fetchOrderCount,
  fetchAllOrders,
  createTour,
  getRouteResponse,
  deleteTours,
  exportTours,
  fetchRouteSegmentData,
  updateTour,
  getOrderCount, 
};

export default adminApiService;
