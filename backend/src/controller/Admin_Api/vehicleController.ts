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

// Disable single vehicle
export const disableVehicle = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await vehicleService.disableVehicle(id);

    // Always return 200, frontend can use `status` for logic
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: "Error disabling warehouse",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};


// Disable multiple warehouses
export const disableMultipleVehicle = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const validIds = Array.isArray(ids) ? ids.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0) : [];

    if (validIds.length === 0) {
      return res.status(200).json({
        status: "error",
        message: "No valid warehouse IDs provided",
      });
    }

    const result = await vehicleService.disableVehiclesBulk(validIds);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: "Error disabling warehouses",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
