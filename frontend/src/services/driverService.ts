import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/admin/drivers';

export const getAllDrivers = async () => {
  const response = await axios.get(API_BASE);
  return response.data;
};

export const createDriver = async (driver: any) => {
  const response = await axios.post(API_BASE, driver);
  return response.data;
};

export const updateDriver = async (id: number, driver: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, driver);
  return response.data;
};

export const deleteDriver = async (id: number) => {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
};

export const deleteDriversBulk = async (ids: number[]) => {
  const response = await axios.post(`${API_BASE}/delete-multiple`, { ids });
  return response.data;
};
