import adminApiService from "../../../services/adminApiService";


export const exportTours = async (tourIds: string[]) => {
  /*   try {
        const numericIds = tourIds.map(id => parseInt(id));
        
        // Get the export data from the API
        const response = await adminApiService.exportTours(numericIds);
        
        console.log('Exported tours data:', response.data);
        
        // Access the actual tours data from response.data.data
        const tours = response.data.data;

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // 1. Create Tours worksheet
        const toursData = tours.map((tour: any) => ({
            'Tour ID': tour.tourinfo_id,
            'Tour Name': tour.tour_name,
            'Driver ID': tour.driver_id,
            'Driver Name': tour.driver_name,
            'Tour Date': tour.tour_date,
            'Start Time': tour.start_time,
            'End Time': tour.end_time,
            'Created At': tour.created_at,
            'Order Count': tour.order_info.length
        }));

        const toursWorksheet = XLSX.utils.json_to_sheet(toursData);
        XLSX.utils.book_append_sheet(workbook, toursWorksheet, "Tours");

        // 2. Create Orders worksheet with tour reference
        const ordersData = tours.flatMap((tour: any) => 
            tour.order_info.map((order: any) => ({
                'Tour ID': tour.tourinfo_id,
                'Tour Name': tour.tour_name,
                'Driver Name': tour.driver_name,
                'Tour Date': tour.tour_date,
                'Order ID': order.order_id,
                'Order Number': order.order_number,
                'First Name': order.firstname,
                'Last Name': order.lastname
                // Add other order fields as needed
            }))
        );

        const ordersWorksheet = XLSX.utils.json_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(workbook, ordersWorksheet, "Orders");

        // 3. (Optional) Create a summary sheet
        const summaryData = [{
            'Total Tours': tours.length,
            'Total Orders': tours.reduce((sum: number, tour: any) => sum + tour.order_info.length, 0),
            'Export Date': new Date().toISOString().slice(0, 10)
        }];

        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

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
    } */
};