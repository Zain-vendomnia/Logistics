import adminApiService from "../../../services/adminApiService";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


export const exportTours = async (tourIds: string[]) => {
    try {
        if (!Array.isArray(tourIds)) {
            throw new Error('tourIds must be an array');
        }

        const numericIds = tourIds.map(id => parseInt(id));
        const response = await adminApiService.exportTours(numericIds);

        console.log('Exported tours data:', response?.data);

        if (!response || !response.data) {
            throw new Error('No data received from the API');
        }

        const tours = response.data;
        if (!Array.isArray(tours)) {
            throw new Error('Expected array of tours in response data');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tour Orders');

        const headers = [
            'Tour ID', 'Tour Name', 'Tour Date', 'Tour Start Time', 'Tour End Time', 'Route Color',
            'Driver Name', 'Driver Mobile', 'Driver Address',
            'Order ID', 'Order Number', 'Customer ID', 'Customer Number', 'Invoice Amount', 'Order Time', 'Expected Delivery',
            'First Name', 'Last Name', 'Email', 'Street', 'Zipcode', 'City', 'Phone',
            'Article Number', 'Quantity', 'Warehouse ID'
        ];

        // Add header row
        const headerRow = worksheet.addRow(headers);

        // Style header row
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ED6508' }, // Red background
            };
            cell.font = {
                color: { argb: 'FFFFFF' }, // White font
                bold: true,
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Populate data rows
        tours.forEach((tour: any) => {
            if (!tour?.orders) return;
            tour.orders.forEach((order: any) => {
                if (!order?.items) return;
                order.items.forEach((item: any) => {
                    const rowData = [
                        tour.id || '',
                        tour.tour_name || '',
                        tour.tour_date || '',
                        tour.tour_startTime || '',
                        tour.tour_endTime || '',
                        tour.tour_route_color || '',
                        tour.driver?.driver_name || '',
                        tour.driver?.mobile || '',
                        tour.driver?.address || '',
                        order.order_id || '',
                        order.order_number || '',
                        order.customer_id || '',
                        order.customer_number || '',
                        order.invoice_amount || '',
                        order.order_time || '',
                        order.expected_delivery_time || '',
                        order.firstname || '',
                        order.lastname || '',
                        order.email || '',
                        order.street || '',
                        order.zipcode || '',
                        order.city || '',
                        order.phone || '',
                        item.slmdl_articleordernumber || '',
                        item.quantity || '',
                        order.warehouse_id || ''
                    ];

                    const row = worksheet.addRow(rowData);

                    // Highlight Phone column (index 22 = position 23) if empty
                    if (!order.phone) {
                        const phoneCell = row.getCell(23);
                        phoneCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF0000' }, // Red
                        };
                        phoneCell.font = {
                            color: { argb: 'FFFFFFFF' }, // White
                        };
                    }
                });
            });
        });

        if (worksheet.columns) {
            worksheet.columns.forEach((column) => {
                let maxLength = 10;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                    const cellText = cell.value ? cell.value.toString() : '';
                    maxLength = Math.max(maxLength, cellText.length);
                });
                column.width = maxLength + 2;
            });
        }
        // Create Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, `tours_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
        return tours;
    } catch (error) {
        console.error('Error exporting tours with ExcelJS:', error);
        throw error;
    }
};
