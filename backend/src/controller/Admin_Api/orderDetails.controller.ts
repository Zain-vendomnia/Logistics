import { Request, Response } from "express";
import { fetchOrderItems } from "../../services/orderDetails.service";
import { ApiResponse } from "../../types/apiResponse.type";

/**
 * GET /admin/orderDetails
 */
export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.query;

    // 🧩 Step 1: Validate input
    if (orderNumber === undefined || orderNumber === null || orderNumber === "") {
      const response: ApiResponse = {
        status: "error",
        message: "'orderNumber' parameter is required.",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    if (isNaN(Number(orderNumber))) {
      const response: ApiResponse = {
        status: "error",
        message: "'orderNumber' must be a valid numeric value.",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    // 🧩 Step 2: Call service
    const result = await fetchOrderItems(Number(orderNumber));

    // 🧩 Step 3: Evaluate service result and respond
    if (!result.found) {
      const response: ApiResponse = {
        status: "error",
        message: `No order found for order number ${orderNumber}.`,
        statusCode: 404,
      };
      return res.status(404).json(response);
    }

    // 🧩 Step 4: Handle cancelled orders
    if (result.canceled) {
      const response: ApiResponse = {
        status: "warning",
        message: `Order ${orderNumber} has already been cancelled.`,
        statusCode: 200,
      };
      return res.status(200).json(response);
    }

    // 🧩 Step 5: Handle non-delivered orders
    if (!result.delivered) {
      const response: ApiResponse = {
        status: "warning",
        message: `Order ${orderNumber} is not delivered yet (current status: '${result.status}').`,
        statusCode: 200,
      };
      return res.status(200).json(response);
    }

    // 🧩 Step 6: Handle empty order items
    if (!result.orderItems || result.orderItems.length === 0) {
      const response: ApiResponse = {
        status: "warning",
        message: `No items found for order number ${orderNumber}.`,
        statusCode: 200,
        data: { orderItems: [] },
      };
      return res.status(200).json(response);
    }

    // 🧩 Step 7: Success
    const response: ApiResponse = {
      status: "success",
      message: "Order items fetched successfully.",
      statusCode: 200,
      data: { orderItems: result.orderItems },
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
