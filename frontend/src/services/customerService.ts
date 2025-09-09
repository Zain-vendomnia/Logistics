import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/admin/customers';

export const getAllCustomers = async () => {
  const response = await axios.get(API_BASE, { headers: authHeader() });
  return response.data;
};
