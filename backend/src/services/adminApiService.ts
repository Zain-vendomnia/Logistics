// adminApiService.ts
import axios from 'axios';

const adminApiService = {
  getPicklistData: async (tourId: string) => {
    try {
      const response = await axios.get(`/api/admin/routeoptimize/getAlltours/${tourId}`);
      return response.data; // Assuming your response has the correct structure
    } catch (error) {
      console.error('Error fetching picklist data:', error);
      throw error;
    }
  },
};

export default adminApiService;
