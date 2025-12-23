import { Request, Response } from "express";
import { ApiResponse } from "../../types/apiResponse.type";
import { fetchOrderDetailsAsync } from "../../services/logisticOrder.service";

// order_number
export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { orderNumber: order_number } = req.query;

    if (!order_number || isNaN(+order_number)) {
      const response: ApiResponse = {
        status: "error",
        message: "Invalid parameter order number provided.",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    const orderWithItems = await fetchOrderDetailsAsync(Number(order_number));

    if (!orderWithItems) {
      const response: ApiResponse = {
        status: "error",
        message: `No order found for order number ${order_number}.`,
        statusCode: 404,
      };
      return res.status(404).json(response);
    }

    const resObject = {
      order_id: orderWithItems.order_id,
      orderItems: orderWithItems.items,
    };

    const response: ApiResponse = {
      status: "success",
      message: "Order items fetched successfully.",
      statusCode: 200,
      data: resObject,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Internal server error occurred.",
      statusCode: 500,
    };
    return res.status(500).json(response);
  }
};
