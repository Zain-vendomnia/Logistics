import { Request, Response } from "express";
import { GeocodingService } from "../../services/geocodingService";
import { RowDataPacket } from "mysql2";
import pool from "../../config/database";

export class GeocodingController {
  static async getLatLng(_req: Request, res: Response): Promise<void> {
    try {
      const result = await GeocodingService.geocodeAllOrders();
      if (result.length > 0) {
        res.status(200).json(result); // Return the list of geocoded addresses with lat/lng
      } else {
        res.status(404).json({ error: "No orders found or geocoding failed" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }

  static async getLatLngtest(_req: Request, _res: Response): Promise<void> {
    const [ordersWithMissingCoords] = await pool.query<RowDataPacket[]>(
      "SELECT order_id, street, city, zipcode FROM logistic_order WHERE lattitude IS NULL OR longitude IS NULL"
    );

    for (const order of ordersWithMissingCoords) {
      await checkAndUpdateLatLng(
        order.order_id,
        order.street,
        order.city,
        order.zipcode
      );
    }
  }
}
async function checkAndUpdateLatLng(
  order_id: any,
  street: any,
  city: any,
  zipcode: any
) {
  try {
    const serviceData = await GeocodingService.geocodeOrderUpdatedCustomer(
      order_id,
      street,
      city,
      zipcode
    );
    if (serviceData) {
      console.log(`Successfully updated lat/lng for order ID ${order_id}`);
    } else {
      console.warn(`Failed to update lat/lng for order ID ${order_id}`);
    }
  } catch (error) {
    console.error(
      `Error while updating lat/lng for order ID ${order_id}:`,
      error
    );
  }
}
