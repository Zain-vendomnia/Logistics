import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/admin/warehouses';

export const getAllWarehouses = async () => {
  const response = await axios.get(API_BASE);
  return response.data;
};

export const createWarehouse = async (warehouse: any) => {
  const response = await axios.post(API_BASE, warehouse);
  return response.data;
};

export const updateWarehouse = async (id: number, warehouse: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, warehouse);
  return response.data;
};

export const deleteWarehouse = async (id: number) => {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
};

export const deleteWarehousesBulk = async (ids: number[]) => {
  const response = await axios.post(`${API_BASE}/delete-multiple`, { ids });
  return response.data;
};
