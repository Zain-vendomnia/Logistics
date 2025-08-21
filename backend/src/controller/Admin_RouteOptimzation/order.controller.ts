import { Request, Response } from "express";
import { LogisticOrder } from "../../model/LogisticOrders";
import { CheckOrderCount, PinboardOrder } from "../../types/dto.types";
import { logWithTime } from "../../utils/logging";

export const getAllLogisticOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await LogisticOrder.getAll(); // Shopware orders
    const wmsOrderNumbers = await LogisticOrder.getWmsOrderNumbers(); // WMS order numbers

    // console.log("shopware Orders:", orders);
    // console.log("WMS Order Numbers:", wmsOrderNumbers);
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

export const getLgsticOrderById = async (_req: Request, res: Response) => {
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
    const orders: PinboardOrder[] =
      await LogisticOrder.getPinboardOrdersAsync(); // Shopware orders

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
