import axios from "axios";
import authHeader from './auth-header';

const API_URL = "http://localhost:8080/api/admin/returns";



export const getAllReturns = async () => {
  const res = await axios.get(API_URL, { headers: authHeader() });
  return res.data;
};

export const updateReturn = async (id: number, payload: { return_quantity: number }) => {
  const res = await axios.put(`${API_URL}/update/${id}`, payload, { headers: authHeader() });
  return res.data;
};

export const deleteReturn = async (id: number) => {
  const res = await axios.delete(`${API_URL}/delete/${id}`, { headers: authHeader() });
  return res.data;
};

export const deleteAllReturns = async () => {
  const res = await axios.delete(`${API_URL}/delete-all`, { headers: authHeader() });
  return res.data;
};
