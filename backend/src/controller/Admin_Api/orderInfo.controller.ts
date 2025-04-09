import { Request, Response } from "express";
import { fetchOrders } from "../../services/orderInfo.service";

export const orderInfoController = async (_: Request, res: Response) => {
  try {
    // Call fetchOrders without any query parameters
    const orders = await fetchOrders();

    return res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
