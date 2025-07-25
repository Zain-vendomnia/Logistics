// adminApiService.ts
import axios from 'axios';
import authHeader from './auth-header';

const API_BaseUrl = "http://localhost:8080/api/admin/routeoptimize/";
const API_BaseUrl_Admin = "http://localhost:8080/api/admin/";

const fetchRouteData = () => axios.get(`${API_BaseUrl}optimize`, { headers: authHeader() });
const fetchOrderTourCount = () => axios.get(`${API_BaseUrl}tourcount`, { headers: authHeader() });
const fetchAllTours = () => axios.get(`${API_BaseUrl}getAlltours`, { headers: authHeader() });
const fetchOrderCount = () => axios.get(`${API_BaseUrl}ordercount`, { headers: authHeader() });
const fetchAllOrders = () => axios.get(`${API_BaseUrl}orders`, { headers: authHeader() });
const fetchSpecifiedOrder = (order_number: string) => {
  return axios.post(`${API_BaseUrl}getOrder`, { order_number });
};
const createTour = (tourData: Record<string, any>) => 
  axios.post(`${API_BaseUrl}createtour`, tourData, { headers: authHeader() });

const createtourHereApi = (tourDatas: Record<string, any>) => 
  axios.post(`${API_BaseUrl}createtourHereApi`, tourDatas, { headers: authHeader() });


const getRouteResponse = (tour_id: number) => 
  axios.post(`${API_BaseUrl}getGraphhopperRoute`, { tour_id }, { headers: authHeader() });

const deleteTours = (tourIds: number[]) =>
  axios.delete(`${API_BaseUrl}deleteTours`, {
    headers: authHeader(),
    data: { tourIds },
  });

const exportTours = (tourIds: number[] | string[]) => 
  axios.post(`${API_BaseUrl}exportTours`, { tourIds }, { headers: authHeader() });

const fetchRouteSegmentData = (tour_id: number) => 
  axios.post(`${API_BaseUrl}getSegmentRoute`, { tour_id }, { headers: authHeader() });

const updateTour = (tourData: Record<string, any>) => 
  axios.put(`${API_BaseUrl}updateTour`, tourData, { headers: authHeader() });

const getOrderCount = async (): Promise<number> => {
  try {
    const response = await axios.get<{ count: number }[]>(
      `${API_BaseUrl}orderCount`,
      { headers: authHeader() }
    );
    const count = response.data[0]?.count ?? 0;
    return count;
  } catch (error) {
    console.error('Error fetching order count:', error);
    throw new Error('Failed to fetch order count');
  }
};
const picklistEmail = (emailData: any) => {
  return axios.post(API_BaseUrl_Admin + "picklistEmail", emailData);
};

const fetchAlltourstatushistory = () => axios.get(`${API_BaseUrl}gettourStatushistory`, { headers: authHeader() });
const update_tourstatus = (tour_id: number) => axios.post(`${API_BaseUrl}updatetourstatus/${tour_id}`, {}, {
    headers: authHeader()
  });

const checkDriverRest = async (driverId: number) => {
  try {
    const response = await axios.get(
      `http://localhost:8080/api/admin/drivers/check-eligibility/${driverId}`,
      { headers: authHeader() }
    );
    return response.data; // This should include nextTourEligible, message, restHours, etc.
  } catch (error) {
    console.error(`Error checking rest for driver ${driverId}:`, error);
    throw error;
  }
};

const updateCustomerInfo = (customerData: Record<string, any>) =>
  axios.put(`http://localhost:8080/api/admin/routeoptimize/updateCustomer`, customerData, {
    headers: authHeader()
  });

  const getLatLngFromAddress = async ({
    street,
    city,
    zipcode,
  }: { street: string; city: string; zipcode: string }) => {
  const fullAddress = `${street}, ${zipcode} ${city}, Germany`;
  return axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
    params: {
      q: fullAddress,
      key: process.env.REACT_APP_OPENCAGE_API_KEY,
    }
  });
};

const insertParkingPermit = (formData: any) => {

    return axios.post(API_BaseUrl_Admin + "insertParkingPermit", formData, {
      headers: authHeader(),
    });
  };
const plotheremap = () => axios.post(`${API_BaseUrl_Admin}hereMapController`, { headers: authHeader() });

export const uploadexcel = (formData: FormData) =>
  axios.post(`${API_BaseUrl_Admin}uploadexcel`, formData, {
    headers: {
      ...authHeader(),
      'Content-Type': 'multipart/form-data',
    },
  });

const adminApiService = {
  fetchRouteData,
  fetchOrderTourCount,
  fetchAllTours,
  fetchOrderCount,
  fetchAllOrders,
  fetchSpecifiedOrder,
  createTour,
  getRouteResponse,
  getLatLngFromAddress,
  deleteTours,
  exportTours,
  fetchRouteSegmentData,
  updateTour,
  getOrderCount,
  picklistEmail,
  fetchAlltourstatushistory,
  update_tourstatus,
  checkDriverRest,
  updateCustomerInfo,
  insertParkingPermit,
  plotheremap,
  createtourHereApi,
  uploadexcel,
};

export default adminApiService;