// import pool from "../../database";
import { Request, Response } from "express";
import { emitNewOrder } from "../../socket";
import { PinboardOrder } from "../../types/dto.types";
import { LogisticOrder } from "../../model/LogisticOrders";

// function randomOffset(maxOffset = 0.009) {
//   return (Math.random() * 2 - 1) * maxOffset;
// }

export async function newShopOrder(_req: Request, res: Response) {
  try {
    const { id } = _req.query;

    // const [rows] = await pool.execute(
    //   `SELECT * FROM logistic_order WHERE order_number = ?`,
    //   [400098046] // source order
    // );
    // const orderData: any =
    //   Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    const orders: PinboardOrder[] =
      await LogisticOrder.getPinboardOrdersAsync();
    const orderData = orders[0];
    if (!orderData) {
      return res.status(404).json({ message: "Original order not found" });
    }

    const newOrderNumber = 400000000 + Math.floor(Math.random() * 1000000);

    // Randomized location around the original coordinates
    // const newLat = parseFloat(orderData.lattitude) + randomOffset(0.002); // ~±200m
    // const newLng = parseFloat(orderData.longitude) + randomOffset(0.002);

    const new_order: PinboardOrder = {
      id: Number(id),
      order_number: String(newOrderNumber),

      city: orderData.city,
      zipcode: orderData.zipcode,
      street: orderData.street,

      order_time: orderData.order_time,
      delivery_time: orderData.delivery_time,
      // location: { lat: newLat, lng: newLng },
      location: orderData.location,
      warehouse_id: orderData.warehouse_id,
      warehouse: orderData.warehouse,
    };

    emitNewOrder(new_order);

    return res.status(201).json({
      message: "Order cloned successfully",
      newOrderNumber,
      location: orderData.location,
      // location: { lat: newLat, lng: newLng },
    });
  } catch (error) {
    console.error("Error cloning order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
