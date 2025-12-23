import { Request, Response } from "express";
import * as cancelService from "../../services/logisticOrder.service";
import { ApiResponse } from "../../types/apiResponse.type";
import { PickupOrderReq, OrderItem } from "../../types/order.types";
import { LogisticOrder, OrderType } from "../../model/LogisticOrders";

// ==========================================
// REQUEST INTERFACES
// ==========================================

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

const validateCancelOrderItem = (
  item: OrderItem
): { valid: boolean; error?: string } => {
  if (!item.slmdl_articleordernumber?.trim()) {
    return {
      valid: false,
      error: "Each item must have a valid article number",
    };
  }

  if (!item.cancelled_quantity || item.cancelled_quantity <= 0) {
    return {
      valid: false,
      error: `Cancel quantity must be greater than 0 for article ${item.slmdl_articleordernumber}`,
    };
  }

  if (item.cancelled_quantity > item.quantity) {
    return {
      valid: false,
      error: `Cancel quantity (${item.cancelled_quantity}) cannot exceed original quantity (${item.quantity}) for article ${item.slmdl_articleordernumber}`,
    };
  }

  return { valid: true };
};

// ==========================================
// GET ALL CANCEL ORDERS (WITHOUT ITEMS)
// ==========================================
/**
 
 */
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
      items: cancelItems,
    }: PickupOrderReq = req.body;

    // Validate user_id
    if (!user_id || typeof user_id !== "number") {
      return sendError(
        res,
        400,
        "User ID is required and must be a valid number"
      );
    }

    // Validate items array
    if (!Array.isArray(cancelItems) || cancelItems.length === 0) {
      return sendError(res, 400, "At least one cancel item is required");
    }

    // Validate each item
    for (const item of cancelItems) {
      const validation = validateCancelOrderItem(item);
      if (!validation.valid) {
        return sendError(res, 400, validation.error!);
      }
    }

    const result = await cancelService.createPickupOrder(
      parentOrderId,
      user_id,
      "",
      cancelItems
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
    const { id } = req.params;
    const { order_id, user_id, items }: PickupOrderReq = req.body;

    if (!id || isNaN(Number(id))) {
      return sendError(res, 400, "Valid cancel ID is required");
    }

    if (!order_id || items.length <= 0) {
      return sendError(res, 400, "Cancel quantity must be greater than 0");
    }

    const result = await cancelService.updateOrderItemsQty(
      order_id,
      user_id,
      items
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

// ==========================================
// DELETE SINGLE CANCEL ITEM
// ==========================================
/**
 * @route DELETE /api/cancels/:id
 * @desc Delete a specific cancel item by ID
 * @access Public
 */
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
