// /services/customerService.ts
import axios from 'axios';
import authHeader from './auth-header';
import { Customer, ApiResponse } from '../components/notification/shared/types';

const API_BASE = 'http://localhost:8080/api/admin/customers';

export const getAllCustomers = async (): Promise<ApiResponse<Customer[]>> => {
  try {
    const response = await axios.get(API_BASE, { headers: authHeader() });
    return response.data; // Backend returns { status, message, data }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw new Error('Failed to load customers. Please try again.');
  }
};