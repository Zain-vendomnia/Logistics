import { Request, Response } from 'express';
import pool from "../../database";
import { RowDataPacket } from 'mysql2';

interface ExportRequest {
  tourIds: number[];
}

export const ExportTourController = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { tourIds }: ExportRequest = req.body;
    console.log("Received tour IDs for export:", tourIds);
    if (!tourIds || !Array.isArray(tourIds) || tourIds.length === 0) {
      return res.status(400).json({ message: "Please provide valid tour IDs array" });
    }

    // Convert all IDs to numbers and filter out any invalid values
    const validTourIds = tourIds
      .map(id => Number(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validTourIds.length === 0) {
      return res.status(400).json({ message: "No valid tour IDs provided" });
    }

    // Fetch only the requested tours
    const placeholders = validTourIds.map(() => '?').join(',');
    const [tourRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.*, 
        d.name AS driver_name, 
        d.mob AS driver_mobile, 
        d.address AS driver_address 
      FROM tourinfo_master t
      JOIN driver_details d ON t.driver_id = d.id
      WHERE t.id IN (${placeholders})
    `, validTourIds);

    if (tourRows.length === 0) {
      return res.status(404).json({ message: "No tours found with the provided IDs" });
    }

    // Prepare final response array
    const allTours = [];

    for (const tour of tourRows) {
      // Parse order_ids safely
      let orderIds: number[] = [];

      try {
        const rawOrderIds = typeof tour.order_ids === 'string'
          ? JSON.parse(tour.order_ids)
          : tour.order_ids;

        if (Array.isArray(rawOrderIds)) {
          orderIds = rawOrderIds
            .map((id: any) => Number(id))
            .filter((id: number) => !isNaN(id));
        }
      } catch (err) {
        console.error("Error parsing order_ids for tour:", tour.id, err);
      }

      let orders: any[] = [];

      if (orderIds.length > 0) {
        // First get the orders
        const orderPlaceholders = orderIds.map(() => '?').join(',');
        const [orderRows] = await pool.query<RowDataPacket[]>(`
          SELECT * FROM logistic_order
          WHERE order_id IN (${orderPlaceholders})
        `, orderIds);
        
        // Then for each order, get the items
        for (const order of orderRows) {
          const [itemRows] = await pool.query<RowDataPacket[]>(`
            SELECT 
              slmdl_articleordernumber, 
              quantity 
            FROM logistic_order_items
            WHERE order_id = ?
          `, [order.order_id]);
          
          // Add items to the order object
          orders.push({
            ...order,
            items: itemRows
          });
        }
      }

      // Assemble tour object
      allTours.push({
        id: tour.id,
        tour_name: tour.tour_name,
        tour_date: tour.tour_date,
        tour_route_color: tour.route_color,
        tour_startTime: tour.start_time,
        tour_endTime: tour.end_time,
        driver: {
          driver_name: tour.driver_name,
          mobile: tour.driver_mobile,
          address: tour.driver_address
        },
        order_ids: tour.order_ids, 
        orders
      });
    }

    res.status(200).json(allTours);
  } catch (error) {
    console.error("Error fetching tour data:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};