import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/driver';

export const getAllDrivers = async () => {
  const response = await axios.get(API_BASE, { headers: authHeader() });
  return response.data;
};

export const createDriver = async (driver: any) => {
  const response = await axios.post(API_BASE, driver, { headers: authHeader() });
  return response.data;
};

export const updateDriver = async (id: number, driver: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, driver, { headers: authHeader() });
  return response.data;
};

export const disableDriver = async (id: number) => {
  const response = await axios.patch(`${API_BASE}/${id}/disable`,{}, { headers: authHeader() });
  return response.data;
};

export const disableDriversBulk = async (ids: number[]) => {
  const response = await axios.patch(`${API_BASE}/disable-multiple`, { ids }, { headers: authHeader() });
  return response.data;
};

export const getAvailableDrivers = async (tourDate: string, warehouseId: number ) => {
  const response = await axios.get(`${API_BASE}/available`, {
    headers: authHeader(),
    params: {
      tourDate,
      warehouseId
    }
  });
  return response.data;
};

// --- New function to get driver performance data ---
export const getDriverPerformanceData = async (startDate: string, endDate: string) => {
  // Assuming your backend exposes a route like '/performance' to get driver stats
  const response = await axios.get(`${API_BASE}/performance?startDate=${startDate}&endDate=${endDate}`, { headers: authHeader() });
  return response.data;
};


// export const startTrip = async (formData: any) => {

//   const response = await axios.post(`${API_BASE}/start-trip`, { headers: authHeader() });

//   // return response.data;
// };