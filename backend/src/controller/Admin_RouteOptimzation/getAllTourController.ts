import pool from "../../database";
import { RowDataPacket } from 'mysql2';

export const getAllTourController = async (_req: any, res: any) => {
  try {
    const [tourRows] = await pool.query<RowDataPacket[]>(`
     SELECT 
    t.*, 
    d.name AS driver_name, 
    d.id AS driver_id,
    d.mob AS driver_mobile, 
    d.address AS driver_address,
    w.warehouse_name AS warehouse_name,
    w.address AS warehouse_address
    FROM tourinfo_master t
    JOIN driver_details d ON t.driver_id = d.id
    JOIN warehouse_details w ON t.warehouse_id = w.warehouse_id;
    `);
  
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
      let totalOrderQuantity = 0; // Initialize total order quantity for the tour

      if (orderIds.length > 0) {
        // First get the orders
        // First get the orders
        const placeholders = orderIds.map(() => '?').join(',');
        const [orderRows] = await pool.query<RowDataPacket[]>(`
          SELECT * FROM logistic_order
          WHERE order_id IN (${placeholders})
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

          // Calculate the total quantity for this order
          const orderTotalQuantity = itemRows.reduce((sum: number, item: any) => sum + item.quantity, 0);

          // Add the order's total quantity to the overall total
          totalOrderQuantity += orderTotalQuantity;
          const [segmentCommentRows] = await pool.query<RowDataPacket[]>(`SELECT comments FROM route_segments WHERE order_id = ? AND tour_id = ?`, [order.order_id, tour.id]);
          const comment = segmentCommentRows.length > 0 ? segmentCommentRows[0].comments : null;
          // Add items and the order's total quantity to the orders array
          orders.push({
            ...order,
            items: itemRows,
            notice: comment,
            });
        }
      }

      // Assemble tour object with the total quantity for all orders
      allTours.push({
        id: tour.id,
        tour_name: tour.tour_name,
        tour_date: tour.tour_date,
        warehouseId: tour.warehouse_id,
        warehouseName: tour.warehouse_name,
        warehouseaddress:tour.warehouse_address,
        tour_route_color: tour.route_color,
        tour_startTime: tour.start_time,
        tour_endTime: tour.end_time,
        tour_comments: tour.comments,
        tour_status: tour.tour_status,
        driver: {
          driver_name: tour.driver_name,
          driver_id: tour.driver_id,
          mobile: tour.driver_mobile,
          email:tour.email,
          licenceplate:tour.licenceplate,
          address: tour.driver_address
        },
        order_ids: tour.order_ids, 
        orders,
        totalOrderQuantity // Add the total quantity for the tour outside the orders
      });
    }

    res.status(200).json(allTours);
  } catch (error) {
    console.error("Error fetching tour data:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};
