import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/admin/drivers';

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

export const deleteDriver = async (id: number) => {
  const response = await axios.delete(`${API_BASE}/${id}`, { headers: authHeader() });
  return response.data;
};

export const deleteDriversBulk = async (ids: number[]) => {
  const response = await axios.post(`${API_BASE}/delete-multiple`, { ids }, { headers: authHeader() });
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
export const getDriverPerformanceData = async () => {
  // Assuming your backend exposes a route like '/performance' to get driver stats
  const response = await axios.get(`${API_BASE}/performance?startDate=2025-06-09&endDate=2025-06-10`, { headers: authHeader() });
  return response.data;
};