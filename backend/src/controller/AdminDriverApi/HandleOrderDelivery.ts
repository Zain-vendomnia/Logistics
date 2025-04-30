
import { Request, Response } from 'express';
import pool from '../../database';

export async function HandleOrderDelivery(req: Request, res: Response) {
  const tourId = Number(req.params.tourId);
  const { status, order_id } = req.body;

  if (!tourId || isNaN(tourId)) {
    return res.status(400).json({ message: 'Invalid or missing tourId' });
  }

  try {
    // 1. If status + order_id is provided, update the status
    if (status && order_id) {
        console.log("order_id"+order_id);
        console.log(
            `Running SQL: UPDATE route_segments SET status = '${status}', delivery_time = NOW() WHERE order_id = '${order_id}' AND tour_id = '${tourId}'`
          );
      const [updateResult]: any = await pool.execute(
        `UPDATE route_segments SET status = ?, delivery_time = NOW() WHERE order_id = ? AND tour_id = ?`,
        [status, order_id, tourId]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found or already updated' });
      }
    }

    // 2. Fetch next pending order in the tour
    const [rows]: any = await pool.execute(
      `SELECT * FROM route_segments WHERE tour_id = ? AND status = 'pending' ORDER BY id ASC LIMIT 1`,
      [tourId]
    );

    if (rows.length === 0) {
      return res.status(200).json({ message: 'No more pending orders for this tour' });
    }

    const nextOrder = rows[0];
   
    const parsedResponse = nextOrder.route_response;

    return res.status(200).json({
      status: 'success',
      data: {
        order_id: nextOrder.order_id,
        route_response: parsedResponse,
        status: nextOrder.status
      }
    });

  } catch (error) {
    console.error('Error in handleOrderDelivery:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
