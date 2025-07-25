import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/admin/warehouses';

export const getAllWarehouses = async () => {
  const response = await axios.get(API_BASE, { headers: authHeader() });
  return response.data;
};

export const createWarehouse = async (warehouse: any) => {
  const response = await axios.post(API_BASE, warehouse, { headers: authHeader() });
  return response.data;
};

export const updateWarehouse = async (id: number, warehouse: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, warehouse, { headers: authHeader() });
  return response.data;
};

export const deleteWarehouse = async (id: number) => {
  const response = await axios.delete(`${API_BASE}/${id}`, { headers: authHeader() });
  return response.data;
};

export const deleteWarehousesBulk = async (ids: number[]) => {
  const response = await axios.post(`${API_BASE}/delete-multiple`, { ids }, { headers: authHeader() });
  return response.data;
};
