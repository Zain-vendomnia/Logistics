import { Request, Response } from "express";
import * as cancelService from "../../services/logisticOrder.service";
import { ApiResponse } from "../../types/apiResponse.type";
import { PickupOrderReq } from "../../types/order.types";
import { LogisticOrder, OrderType } from "../../model/LogisticOrders";
import { validateCancelOrderItem } from "../../helpers/logisticOrder.helper";

const sendError = (
  res: Response,
  statusCode: number,
  message: string
): void => {
  res.status(statusCode).json({
    status: "error",
    message,
    statusCode,
  });
};

const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): void => {
  const response: ApiResponse = {
    status: "success",
    message,
    statusCode,
    ...(data && { data }),
  };
  res.status(statusCode).json(response);
};

// ==========================================
// GET ALL CANCEL ORDERS (WITHOUT ITEMS)
// ==========================================
export const getAllCancelOrders = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await cancelService.getOrdersByTypes([
      OrderType.PICKUP,
      OrderType.EXCHANGE,
    ]);
    sendSuccess(res, 200, "Cancel orders fetched successfully", data);
  } catch (error: any) {
    console.error("Error in getAllCancelOrders:", error);
    sendError(res, 500, error.message || "Error fetching cancel orders");
  }
};

// ==========================================
// GET CANCEL ITEMS BY ORDER NUMBER
// ==========================================
/**
 * @route GET /api/cancels/:orderNumber/items
 * @desc Get all cancel items for a specific order (lazy loading)
 * @access Public
 */
export const getCancelOrderItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber?.trim()) {
      return sendError(res, 400, "Order number is required");
    }

    const data = await cancelService.getCancelOrderItemsAsync(+orderNumber);

    sendSuccess(res, 200, "Cancel items fetched successfully", data);
  } catch (error: any) {
    console.error("Error in getCancelOrderItems:", error);
    sendError(res, 500, error.message || "Error fetching cancel items");
  }
};

// ==========================================
// CREATE NEW CANCEL ORDER
// ==========================================
/**
 * @route POST /api/cancels
 * @desc Create a new cancel order with items
 * @access Public
 */
export const createCancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      order_id: parentOrderId,
      user_id,
      items: orderItems,
    }: PickupOrderReq = req.body;

    // Validate user_id
    if (!user_id || typeof user_id !== "string") {
      return sendError(
        res,
        400,
        "User ID is required and must be a valid string"
      );
    }

    // Validate items array
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return sendError(res, 400, "At least one cancel item is required");
    }

    // Validate each item
    for (const item of orderItems) {
      const validation = validateCancelOrderItem(item);
      if (!validation.valid) {
        return sendError(res, 400, validation.error!);
      }
    }

    const result = await cancelService.createCancelOrderAsync(
      parentOrderId,
      user_id,
      "",
      orderItems
    );

    if (!result) {
      return sendError(res, 400, "Internal server error");
    }

    sendSuccess(res, 201, "", result);
  } catch (error: any) {
    console.error("Error in createCancel:", error);
    sendError(res, 500, error.message || "Internal server error");
  }
};

// ==========================================
// SEARCH CANCEL BY ORDER NUMBER
// ==========================================
/**
 * @route GET /api/cancels/search?orderNumber=XXX
 * @desc Search cancel orders by order number
 * @access Public
 */
export const searchCancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderNumber: order_id } = req.query;

    if (!order_id || !Number.isFinite(+order_id)) {
      return sendError(
        res,
        400,
        "Order number is required as a query parameter"
      );
    }

    const data = await LogisticOrder.getOrdersWithItemsAsync([+order_id]);

    if (!data?.length) {
      return sendError(
        res,
        404,
        `No cancel orders found for order number: ${order_id}`
      );
    }

    sendSuccess(res, 200, "Cancel order found successfully", data);
  } catch (error: any) {
    console.error("Error in searchCancelByOrderNumber:", error);
    sendError(res, 500, error.message || "Error searching cancel orders");
  }
};

// ==========================================
// UPDATE CANCEL ITEM
// ==========================================
/**
 * @route PUT /api/cancels/:id
 * @desc Update cancel quantity for a specific cancel item
 * @access Public
 */
export const updateCancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: orderItemId } = req.params;
    const { order_id, cancel_quantity, updated_by } = req.body;
    // const { order_id, user_id, items }: PickupOrderReq = req.body;

    if (
      !order_id ||
      isNaN(order_id) ||
      !orderItemId ||
      isNaN(Number(orderItemId))
    ) {
      return sendError(res, 400, "Valid cancel ID is required");
    }

    // if (!order_id || items.length <= 0) {
    if (!cancel_quantity || +cancel_quantity <= 0) {
      return sendError(res, 400, "Invalid cancel quantity.");
    }

    const result = await cancelService.updateOrderItemQty(
      +order_id,
      +orderItemId,
      +cancel_quantity,
      updated_by
    );

    res.status(result.success ? 200 : 404).json({
      status: result.success ? "success" : "error",
      message: result.message,
      statusCode: result.success ? 200 : 404,
    });
  } catch (error: any) {
    console.error("Error in updateCancel:", error);
    sendError(res, 500, error.message || "Error updating cancel");
  }
};

export const deleteCancel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return sendError(res, 400, "Valid cancel ID is required");
    }

    // const result = await cancelService.deleteCancel(Number(id));
    const result = { success: true };

    res.status(result.success ? 200 : 404).json({
      status: result.success ? "success" : "error",
      message: result.success
        ? "Cancel deleted successfully"
        : "Cancel not found",
      statusCode: result.success ? 200 : 404,
    });
  } catch (error: any) {
    console.error("Error in deleteCancel:", error);
    sendError(res, 500, error.message || "Error deleting cancel");
  }
};

// ==========================================
// DELETE ALL CANCELS
// ==========================================
/**
 * @route DELETE /api/cancels/all
 * @desc Delete all cancel records (both orders and items)
 * @access Admin
 */
export const deleteAllCancels = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // const result = await cancelService.deleteAllCancels();
    // sendSuccess(
    //   res,
    //   200,
    //   result.message || "All cancels deleted successfully",
    //   result
    // );
  } catch (error: any) {
    console.error("Error in deleteAllCancels:", error);
    sendError(res, 500, error.message || "Error deleting all cancels");
  }
};
