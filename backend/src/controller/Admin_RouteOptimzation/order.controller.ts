import { Request, Response } from "express";
import { LogisticOrder } from "../../model/LogisticOrders";
import { CheckOrderCount, pinboardOrder } from "../../types/dto.types";

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

export const getAllLogisticOrder = async (_req: Request, res: Response) => {
  const { order_number } = _req.body; // 

  try {
    const orderData = await LogisticOrder.getOrder(order_number); // Assuming this method exists and works
    res.status(200).json(orderData);
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
    const orders: pinboardOrder[] =
      await LogisticOrder.getPinboardOrdersAsync(); // Shopware orders

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
