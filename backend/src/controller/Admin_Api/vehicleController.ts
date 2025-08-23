import { Request, Response } from "express";
import * as vehicleService from "../../services/vehicleService";

export const getAllVehicles = async (_req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    return res.json(vehicles);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching vehicles" });
  }
};


export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleById(Number(req.params.id));
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(vehicle);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching vehicle" });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    // ✅ Expected shape
    const { capacity, license_plate, warehouse_id, miles_driven, next_service, driver_id, is_active } = req.body;

    // ✅ Basic validation
    if (
      typeof capacity !== "number" ||
      typeof license_plate !== "string" ||
      typeof warehouse_id !== "number"
    ) {
      return res.status(400).json({ message: "Invalid or missing required fields." });
    }

    // Optional validations
    if (miles_driven !== undefined && typeof miles_driven !== "number") {
      return res.status(400).json({ message: "Invalid miles_driven" });
    }
    if (next_service !== undefined && next_service !== null && typeof next_service !== "string") {
      return res.status(400).json({ message: "Invalid next_service" });
    }

    const newVehicle = await vehicleService.createVehicle({
      capacity,
      license_plate,
      warehouse_id,
      miles_driven,
      next_service,
      driver_id,
      is_active,
    });

    return res.status(201).json(newVehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err);
    return res.status(500).json({ message: "Error creating vehicle" });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const updated = await vehicleService.updateVehicle(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Error updating vehicle" });
  }
};
