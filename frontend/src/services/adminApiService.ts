// adminApiService.ts
import axios from "axios";
import authHeader from "./auth-header";
import {
  CreateTour_Req,
  DynamicTourPayload,
  DynamicTourRes,
  rejectTour_Req,
  Tourinfo,
  TourRow,
  TourStatus,
  UpdateTour_Req,
} from "../types/tour.type";
import { Order, SolarModule } from "../types/order.type";
import { Warehouse } from "../types/warehouse.type";

const API_BaseUrl = "http://localhost:8080/api/admin/routeoptimize/";
const API_BaseUrl_Admin = "http://localhost:8080/api/admin/";

const fetchRouteData = () =>
  axios.get(`${API_BaseUrl}optimize`, { headers: authHeader() });
const fetchOrderTourCount = () =>
  axios.get(`${API_BaseUrl}tourcount`, { headers: authHeader() });

const fetchToursByStatus = async (status: TourStatus): Promise<TourRow[]> => {
  const res = await axios.get(`${API_BaseUrl}getToursByStatus`, {
    params: { status },
    headers: authHeader(),
  });
  const tourRows = (res.data as TourRow[]).map(
    (t): TourRow => ({
      id: t.id,
      tour_name: t.tour_name,
      tour_status: t.tour_status,
      tour_date: t.tour_date,
      route_color: t.route_color,
      comments: t.comments,
      orderIds: t.orderIds,
      driver_id: t.driver_id || 0,
      driver_name: t.driver_name || "N/A",
      vehicle_id: t.vehicle_id,
      warehouse_id: t.warehouse_id,
      warehouse_colorCode: t.warehouse_colorCode,
    }),
  );

  return tourRows;
};

const fetchAllTours = () =>
  axios.get(`${API_BaseUrl}getAlltours`, { headers: authHeader() });
const fetchOrderCount = () =>
  axios.get(`${API_BaseUrl}ordercount`, { headers: authHeader() });

const checkOrdersRecentUpdates = async () =>
  await axios.get(`${API_BaseUrl}checkordersrecentupdates`, {
    headers: authHeader(),
  });

const fetchAllOrders = () =>
  axios.get(`${API_BaseUrl}orders`, { headers: authHeader() });

const fetchSpecifiedOrder = (order_number: string) => {
  return axios.get(`${API_BaseUrl}getOrder`, { params: { order_number } });
};

const fetchOrdersWithItems = async (orderIds: string): Promise<Order[]> => {
  const res = await axios.get(`${API_BaseUrl}ordersWithItems`, {
    params: { orderIds },
  });
  return res.data as Order[];
};

const fetchTourDetails = async (tourId: number): Promise<Tourinfo> => {
  const res = await axios.get(`${API_BaseUrl}tourDetail`, {
    headers: authHeader(),
    params: { tourId },
  });

  return res.data as Tourinfo;
};

const getWarehouse = async (id: number): Promise<Warehouse> => {
  const res = await axios.get(`${API_BaseUrl}getWarehouse/${id}`, {
    headers: authHeader(),
  });

  return res.data as Warehouse;
};

const createTour = (tourData: CreateTour_Req) =>
  axios.post(`${API_BaseUrl}createtour`, tourData, { headers: authHeader() });

const createtourHereApi = (tourDatas: CreateTour_Req) => {
  console.log("tourDatas Received:", tourDatas);
  return axios.post(`${API_BaseUrl}createtourHereApi`, tourDatas, {
    headers: authHeader(),
  });
};

const getRouteResponse = (tour_id: number) =>
  axios.post(
    `${API_BaseUrl}getGraphhopperRoute`,
    { tour_id },
    { headers: authHeader() },
  );

const deleteTours = (tourIds: number[]) =>
  axios.delete(`${API_BaseUrl}deleteTours`, {
    headers: authHeader(),
    data: { tourIds },
  });

const exportTours = (tourIds: number[] | string[]) =>
  axios.post(
    `${API_BaseUrl}exportTours`,
    { tourIds },
    { headers: authHeader() },
  );

const fetchRouteSegmentData = (tour_id: number) =>
  axios.post(
    `${API_BaseUrl}getSegmentRoute`,
    { tour_id },
    { headers: authHeader() },
  );

const fetchRouteSegmentImages = (tour_id?: number, order_number?: string) => {
  return axios.post(
    `${API_BaseUrl}getRoutesSegmentImages`,
    { tour_id, order_number },
    { headers: authHeader() },
  );
};

const updateTour = async (tourData: UpdateTour_Req): Promise<Tourinfo> => {
  const res = await axios.put(`${API_BaseUrl}updateTour`, tourData, {
    headers: authHeader(),
  });

  return res.data;
};

const getOrderCount = async (): Promise<number> => {
  try {
    const response = await axios.get<{ count: number }[]>(
      `${API_BaseUrl}orderCount`,
      { headers: authHeader() },
    );
    const count = response.data[0]?.count ?? 0;
    return count;
  } catch (error) {
    console.error("Error fetching order count:", error);
    throw new Error("Failed to fetch order count");
  }
};
const sendEmail = (emailData: any) => {
  return axios.post(API_BaseUrl_Admin + "sendEmail", emailData);
};

const fetchAlltourstatushistory = () =>
  axios.get(`${API_BaseUrl}gettourStatushistory`, { headers: authHeader() });
const update_tourstatus = (tour_id: number) =>
  axios.post(
    `${API_BaseUrl}updatetourstatus/${tour_id}`,
    {},
    {
      headers: authHeader(),
    },
  );

const checkDriverRest = async (driverId: number) => {
  try {
    const response = await axios.get(
      `${API_BaseUrl_Admin}drivers/check-eligibility/${driverId}`,
      { headers: authHeader() },
    );
    return response.data; // This should include nextTourEligible, message, restHours, etc.
  } catch (error) {
    console.error(`Error checking rest for driver ${driverId}:`, error);
    throw error;
  }
};

const updateCustomerInfo = (customerData: Record<string, any>) =>
  axios.put(`${API_BaseUrl_Admin}routeoptimize/updateCustomer`, customerData, {
    headers: authHeader(),
  });

const getLatLngFromAddress = async ({
  street,
  city,
  zipcode,
}: {
  street: string;
  city: string;
  zipcode: string;
}) => {
  const fullAddress = `${street}, ${zipcode} ${city}, Germany`;
  return axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
    params: {
      q: fullAddress,
      key: process.env.REACT_APP_OPENCAGE_API_KEY,
    },
  });
};

const insertParkingPermit = (formData: any) => {
  return axios.post(API_BaseUrl_Admin + "insertParkingPermit", formData, {
    headers: authHeader(),
  });
};
const plotheremap = () =>
  axios.post(`${API_BaseUrl_Admin}hereMapController`, {
    headers: authHeader(),
  });

const fetchPinboardOrders = async (
  lastFetchedAt?: number | null,
): Promise<Order[]> => {
  const headers: Record<string, string> = {
    ...authHeader(),
    ...(lastFetchedAt ? { "last-fetched-at": `${lastFetchedAt}` } : {}),
  };
  const res = await axios.get(`${API_BaseUrl_Admin}pinboardOrders`, {
    headers,
  });

  return res.data;
};

const newShopOrder = (id: number) =>
  axios.get(`${API_BaseUrl_Admin}newShopwareOrder`, {
    headers: authHeader(),
    params: { id },
  });
// const removeShopOrder = (id: any) =>
//   axios.delete(`${API_BaseUrl_Admin}removeShopwareOrder`, {
//     headers: authHeader(),
//     params: { id },
//   });

const uploadOrdersFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_BaseUrl_Admin}orders/upload`, formData, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

const fetchDynamicTours = async (): Promise<DynamicTourPayload[]> => {
  const res = await axios.get(`${API_BaseUrl_Admin}dynamicTours`, {
    headers: authHeader(),
  });

  return (res.data as DynamicTourPayload[]) || [];
};

const estimateTourMatrix = async (warehouseId: number, orderIds: number[]) => {
  const payload = {
    warehouseId,
    orderIds,
  };
  const res = await axios.post(
    `${API_BaseUrl_Admin}estimateTourMatrix`,
    payload,
    {
      headers: authHeader(),
    },
  );
  return res;
};

const requestDynamicTour = async (
  payload: DynamicTourPayload,
): Promise<DynamicTourRes> => {
  const res = await axios.post(
    `${API_BaseUrl_Admin}createDynamicTour`,
    payload,
    {
      headers: authHeader(),
    },
  );
  return res.data as DynamicTourRes;
};

const acceptDynamicTour = async (payload: CreateTour_Req) => {
  const res = await axios.post(
    `${API_BaseUrl_Admin}acceptDynamicTour`,
    payload,
    {
      headers: authHeader(),
    },
  );
  return res.data;
};

const rejectDynamicTour = async (payload: rejectTour_Req): Promise<boolean> => {
  const res = await axios.post(
    `${API_BaseUrl_Admin}rejectDynamicTour`,
    payload,
    {
      headers: authHeader(),
    },
  );
  return res.data as boolean;
};

export const fetchLogs = async () => {
  const res = await axios.get(`${API_BaseUrl_Admin}logs`, {
    headers: authHeader(),
  });
  return res.data;
};

export const uploadexcel = (formData: FormData) =>
  axios.post(`${API_BaseUrl_Admin}uploadexcel`, formData, {
    headers: {
      ...authHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

const getOrderNotificationMetaData = (orderNumber: number) => {
  return axios.post(API_BaseUrl_Admin + "getOrderNotificationMetaData", {
    headers: authHeader(),
    orderNumber: orderNumber,
  });
};

const updateOrderNotificationMetaData = (
  orderNumber: number,
  meta_key: string,
  meta_value: string,
) => {
  return axios.post(
    API_BaseUrl_Admin + "updateOrderNotificationMetaData",
    { orderNumber: orderNumber, meta_key: meta_key, meta_value: meta_value },
    {
      headers: authHeader(),
    },
  );
};

const getDriverData = (driverId: any) => {
  return axios.post(API_BaseUrl_Admin + "getDriverData", {
    headers: authHeader(),
  });
};
const fetchDriverDetails = (driverId: any) => {
  return axios.post(API_BaseUrl_Admin + "getDriverData", {
    headers: authHeader(),
  });
};

const fetchSolarModules = async (): Promise<SolarModule[]> => {
  const res = await axios.get(API_BaseUrl_Admin + "solarmodules", {
    headers: authHeader(),
  });
  const modules = res.data.data;
  return modules as SolarModule[];
};
const orderDetails = (orderNumber: number) => {
  return axios.get(API_BaseUrl_Admin + "orderDetails", {
    headers: authHeader(),
    params: { orderNumber },
  });
};

const orderHistoryDetails = (orderNumber: number) => {
  return axios.get(API_BaseUrl_Admin + "orderHistory", {
    headers: authHeader(),
    params: { orderNumber },
  });
};

const updateOrderStatus = ({
  order_id,
  newStatus,
  updated_by,
}: {
  order_id: number;
  newStatus: string;
  updated_by: string;
}) => {
  return axios.put(
    `${API_BaseUrl_Admin}orderStatus/${order_id}`,
    { newStatus, updated_by },
    {
      headers: authHeader(),
    },
  );
};

const sendCancelDetails = (cancelData: any) => {
  return axios.post(API_BaseUrl_Admin + "cancels/create", cancelData, {
    headers: authHeader(),
  });
};

const adminApiService = {
  fetchRouteData,
  fetchOrderTourCount,
  fetchToursByStatus,
  fetchAllTours,
  fetchOrderCount,
  checkOrdersRecentUpdates,
  fetchAllOrders,
  fetchSpecifiedOrder,
  fetchOrdersWithItems,
  createTour,
  fetchTourDetails,
  getRouteResponse,
  getLatLngFromAddress,
  deleteTours,
  exportTours,
  fetchRouteSegmentData,
  updateTour,
  getOrderCount,
  sendEmail,
  fetchAlltourstatushistory,
  update_tourstatus,
  checkDriverRest,
  updateCustomerInfo,
  insertParkingPermit,
  plotheremap,
  uploadOrdersFile,
  fetchDynamicTours,
  requestDynamicTour,
  acceptDynamicTour,
  rejectDynamicTour,
  createtourHereApi,
  fetchPinboardOrders,
  uploadexcel,
  getWarehouse,
  newShopOrder,
  getOrderNotificationMetaData,
  updateOrderNotificationMetaData,
  fetchRouteSegmentImages,
  getDriverData,
  fetchDriverDetails,
  fetchLogs,
  estimateTourMatrix,
  orderDetails,
  fetchSolarModules,
  orderHistoryDetails,
  sendCancelDetails,
  updateOrderStatus,
};

export default adminApiService;
