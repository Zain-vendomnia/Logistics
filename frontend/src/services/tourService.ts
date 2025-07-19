import axios from 'axios';
import authHeader from './auth-header';

const API_BASE = 'http://localhost:8080/api/admin/tours';

interface TourParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Fetch filtered + paginated tours
export const getAllTours = async ({
  status = 'all',
  search = '',
  page = 1,
  limit = 10,
}: TourParams) => {
  const response = await axios.get(API_BASE, {
    headers: authHeader(),
    params: { status, search, page, limit },
  });

  return response.data; // Should be: { data: Tour[], total: number }
};
