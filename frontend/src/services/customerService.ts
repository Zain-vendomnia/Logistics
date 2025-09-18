// /services/customerService.ts
// Optimized customer service - clean and efficient

import axios from 'axios';
import authHeader from './auth-header';
import { Customer } from '../components/notification/shared/types'; // Fixed path

// ==========================================
// CONSTANTS
// ==========================================

const API_BASE = 'http://localhost:8080/api/admin/customers';

// ==========================================
// INTERFACES
// ==========================================

interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

// ==========================================
// API FUNCTIONS
// ==========================================

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await axios.get(API_BASE, { headers: authHeader() });
    
    // Handle different response structures
    if (response.data.status === 200 || response.data.status === 'success') {
      return response.data.data || [];
    }
    
    // Fallback for direct array response
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw new Error('Failed to load customers. Please try again.');
  }
};

export const SearchCustomers = async (query: string): Promise<ApiResponse<Customer[]>> => {
  try {
    if (!query.trim()) {
      return {
        status: 'warning',
        message: 'Search query cannot be empty',
        data: []
      };
    }

    const response = await axios.get(
      `${API_BASE}/search?searchTerm=${encodeURIComponent(query)}`, 
      { headers: authHeader() }
    );
    
    return response.data;
  } catch (error) {
    console.error('Search customers failed:', error);
    
    if (axios.isAxiosError(error)) {
      // Fix: Check if response exists first, then check status
      if (error.response?.status === 404) {
        return {
          status: 'warning',
          message: 'No customers found matching your search',
          data: []
        };
      }
      
      // Fix: Check if response exists first, then check status
      if (error.response && error.response.status >= 500) {
        return {
          status: 'error',
          message: 'Server error. Please try again later.',
          data: []
        };
      }
    }
    
    return {
      status: 'error',
      message: 'Search failed. Please check your connection and try again.',
      data: []
    };
  }
};