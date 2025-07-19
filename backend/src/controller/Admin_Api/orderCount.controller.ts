import { Request, Response, NextFunction } from "express";
import { fetchOrdersCount } from "../../services/orderCount.service";

/**
 * GET /api/orders/count
 * Returns { ordersCount: number }
 */
export const getOrderCount = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ordersCount } = await fetchOrdersCount();
    return res.json({ ordersCount });
  } catch (error) {
    // Delegate to centralized error handler
    return next(error);
  }
};
