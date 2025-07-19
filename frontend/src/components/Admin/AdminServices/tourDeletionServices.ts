import adminApiService from "../../../services/adminApiService";

export const deleteTours = async (tourIds: string[]) => {
    try {
        console.log('Deleting tours with IDs:', tourIds);
        
        // Convert string IDs to numbers if backend expects numbers
        const numericIds = tourIds.map(id => parseInt(id));
        
        // Use the adminApiService's deleteTours function
        const response = await adminApiService.deleteTours(numericIds);
        
        console.log('Deletion successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting tours:', error);
        throw error;
    }
};