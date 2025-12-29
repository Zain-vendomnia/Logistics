import { Request, Response } from "express";
import { LogisticOrder } from "../../model/LogisticOrders";
import { CheckOrderCount } from "../../types/dto.types";
import { logWithTime } from "../../utils/logging";
import { Order, OrderHistoryUI } from "../../types/order.types";
import { ApiResponse } from "../../types/apiResponse.type";
import {
  fetchOrderDetailsAsync,
  fetchOrderHistoryAsync,
  updateOrderStatusAsync,
} from "../../services/logisticOrder.service";
import { sendError } from "../../services/helpers/logisticOrder.helper";

export const getAllLogisticOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await LogisticOrder.getAll(); // Shopware orders
    const wmsOrderNumbers = await LogisticOrder.getWmsOrderNumbers(); // WMS order numbers

    console.log("shopware Orders:", orders);
    console.log("WMS Order Numbers:", wmsOrderNumbers);
    // Filter Shopware orders where order_number exists in WMS
    const matchedOrders = orders.filter((order) =>
      wmsOrderNumbers.includes(order.order_number)
    );

    res.status(200).json(matchedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLogisticOrderById = async (_req: Request, res: Response) => {
  const { order_number } = _req.query;

  try {
    const orderData = await LogisticOrder.getOrder(order_number as string);
    res.status(200).json(orderData);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Dynamic Map Board - DMB
export const getOrdersWithItems = async (_req: Request, res: Response) => {
  try {
    const { orderIds } = _req.query;
    if (!orderIds) {
      return res.status(400).json({ message: "order numbers are required" });
    }

    const req_order_Ids: number[] = String(orderIds)
      .split(",")
      .map((id) => Number(id));

    logWithTime(`[getOrdersWithItems]:  ${req_order_Ids}`);

    const ordersWithItems = await LogisticOrder.getOrdersWithItemsAsync(
      req_order_Ids
    );
    res.status(200).json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getcountcheck = async (_req: Request, res: Response) => {
  try {
    const orders = await LogisticOrder.getAllCount();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrdersLastUpdated = async (_req: Request, res: Response) => {
  try {
    const orders = await LogisticOrder.getOrdersLastUpdatedAsync();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders last updated:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCheckOrdersRecentUpdates = async (
  _req: Request,
  res: Response
) => {
  try {
    const orderCount: CheckOrderCount =
      await LogisticOrder.checkOrdersRecentUpdatesAsync();

    res.status(200).json(orderCount);
  } catch (error) {
    console.error("Error fetching orders last updates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPinboardOrders = async (_req: Request, res: Response) => {
  try {
    const sinceHeader = _req.headers["last-fetched-at"] as string | undefined;
    const since = sinceHeader;

    // Shopware orders
    const orders: Order[] = await LogisticOrder.pendingOrdersWithWeightAndItems(
      since
    );
    // const orders: Order[] = await LogisticOrder.getPendingOrdersAsync(since);

    // console.log("pin-b orders: ", orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

export const getOrderHistoryDetails = async (req: Request, res: Response) => {
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

    const history: OrderHistoryUI | null = await fetchOrderHistoryAsync(
      Number(order_number)
    );

    if (!history) {
      const response: ApiResponse = {
        status: "error",
        message: `No order found for order number ${order_number}.`,
        statusCode: 404,
      };
      return res.status(404).json(response);
    }

    // const resObject = {
    //   order_id: history.order_id,
    //   orderItems: history.items,
    // };

    const response: ApiResponse = {
      status: "success",
      message: "Order items fetched successfully.",
      statusCode: 200,
      data: history,
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

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order_id = Number(req.params.id);
    const { newStatus, updated_by } = req.body;

    if (!order_id || isNaN(order_id) || !newStatus || !updated_by) {
      return sendError(res, 400, "Invalid data provided");
    }

    const result = await updateOrderStatusAsync(
      order_id,
      newStatus,
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
