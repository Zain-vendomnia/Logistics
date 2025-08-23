import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/admin/vehicles';

export const getAllVehicles = async () => {
  const response = await axios.get(API_BASE, { headers: authHeader() });
  return response.data;
};
export const getOneVehicle = async (id: number) => {
  const response = await axios.get(`${API_BASE}/${id}`, { headers: authHeader() });
  return response.data;
};

export const createVehicle = async (vehicle: any) => {
  const response = await axios.post(API_BASE, vehicle, { headers: authHeader() });
  return response.data;
};

export const updateVehicle = async (id: number, vehicle: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, vehicle, { headers: authHeader() });
  return response.data;
};
