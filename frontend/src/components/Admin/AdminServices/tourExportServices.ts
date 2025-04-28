import adminApiService from "../../../services/adminApiService";
import * as XLSX from 'xlsx';

export const exportTours = async (tourIds: string[]) => {
    try {
        // Validate input
        if (!Array.isArray(tourIds)) {
            throw new Error('tourIds must be an array');
        }

        const numericIds = tourIds.map(id => parseInt(id));
        
        // Get the export data from the API
        const response = await adminApiService.exportTours(numericIds);
        
        console.log('Exported tours data:', response?.data);

        // Check if response and response.data exists
        if (!response || !response.data) {
            throw new Error('No data received from the API');
        }

        // Access the tours data
        const tours = response.data;

        if (!Array.isArray(tours)) {
            throw new Error('Expected array of tours in response data');
        }

        // Prepare data for single sheet
        const exportData = tours.flatMap((tour: any) => {
            if (!tour || typeof tour !== 'object') {
                console.warn('Invalid tour data encountered');
                return [];
            }

            // Check if orders exist and is an array
            if (!tour.orders || !Array.isArray(tour.orders)) {
                console.warn(`Tour ${tour.id || 'unknown'} has no valid orders array`);
                return [];
            }
            
            return tour.orders.flatMap((order: any) => {
                if (!order || typeof order !== 'object') {
                    console.warn('Invalid order data encountered');
                    return [];
                }

                // Check if items exist and is an array
                if (!order.items || !Array.isArray(order.items)) {
                    console.warn(`Order ${order.order_id || 'unknown'} has no valid items array`);
                    return [];
                }
                
                return order.items.map((item: any) => ({
                    // Tour Information
                    'Tour ID': tour.id || '',
                    'Tour Name': tour.tour_name || '',
                    'Tour Date': tour.tour_date || '',
                    'Tour Start Time': tour.tour_startTime || '',
                    'Tour End Time': tour.tour_endTime || '',
                    'Route Color': tour.tour_route_color || '',
                    
                    // Driver Information
                    'Driver Name': tour.driver?.driver_name || '',
                    'Driver Mobile': tour.driver?.mobile || '',
                    'Driver Address': tour.driver?.address || '',
                    
                    // Order Information
                    'Order ID': order.order_id || '',
                    'Order Number': order.order_number || '',
                    'Customer ID': order.customer_id || '',
                    'Customer Number': order.customer_number || '',
                    'Invoice Amount': order.invoice_amount || '',
                    'Order Time': order.order_time || '',
                    'Expected Delivery': order.expected_delivery_time || '',
                    
                    // Customer Information
                    'First Name': order.firstname || '',
                    'Last Name': order.lastname || '',
                    'Email': order.email || '',
                    'Street': order.street || '',
                    'Zipcode': order.zipcode || '',
                    'City': order.city || '',
                    'Phone': order.phone || '',
                    
                    // Item Information
                    'Article Number': item.slmdl_articleordernumber || '',
                    'Quantity': item.quantity || '',
                    
                    // Warehouse
                    'Warehouse ID': order.warehouse_id || ''
                }));
            });
        });

        // Check if we have any data to export
        if (exportData.length === 0) {
            throw new Error('No valid data to export');
        }

        // Create a new workbook with single sheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tour Orders");

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { 
            bookType: 'xlsx', 
            type: 'array' 
        });
        
        // Create Blob and download
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tours_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return tours;
    } catch (error) {
        console.error('Error exporting tours:', error);
        throw error;
    }
};