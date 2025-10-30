import { Request, Response } from "express";
import { fetchOrderItems } from "../../services/orderDetails.service";

// ✅ API Response interface
interface ApiResponse<T = any> {
  status: "success" | "error" | "warning";
  message: string;
  data: T;
}

/**
 * GET /admin/orderDetails
 */
export const getOrderDetails = async (req: Request, res: Response) => {

  try {
    const { orderNumber } = req.query;

    // ✅ Validate input
    if (!orderNumber || isNaN(Number(orderNumber))) {

      const response: ApiResponse = {
        status: "error",
        message: "Invalid or missing 'orderNumber' parameter.",
        data: {},
      };
      return res.status(200).json(response);
    }


    // ✅ Call service
    const { orderItems } = await fetchOrderItems(Number(orderNumber));


    // ✅ No results found
    if (!orderItems || orderItems.length === 0) {

      const response: ApiResponse = {
        status: "warning",
        message: `No items found for order number ${orderNumber}.`,
        data: { orderItems: [] },
      };
      return res.status(200).json(response);
    }

    // ✅ Success
    const response: ApiResponse = {
      status: "success",
      message: "Order items fetched successfully.",
      data: { orderItems },
    };

    return res.status(200).json(response);
  } catch (error: any) {

    const response: ApiResponse = {
      status: "error",
      message: error.message || "Internal server error occurred.",
      data: {},
    };

    return res.status(200).json(response);
  }
};
