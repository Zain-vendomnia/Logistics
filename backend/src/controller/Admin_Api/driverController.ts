import { Request, Response } from "express";
import * as driverService from "../../services/driverService";

export const getAllDrivers = async (_req: Request, res: Response) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching drivers" });
  }
};

export const getAvailableDriversByDateAndWarehouse = async (req: Request, res: Response) => {
  try {
    const { tourDate, warehouseId } = req.query;
    if (!tourDate || !warehouseId) {
      return res.status(400).json({ message: "tourDate and warehouseId are required query parameters." });
    }

    // Assuming warehouseId is a number
    const warehouseIdNum = Number(warehouseId);
    if (isNaN(warehouseIdNum)) {
      return res.status(400).json({ message: "Invalid warehouseId parameter." });
    }

    // Call your service method to get available drivers for given date & warehouse
    const availableDrivers = await driverService.getAvailableDrivers(tourDate as string, warehouseIdNum);

   return res.json(availableDrivers);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    return res.status(500).json({ message: "Failed to fetch available drivers." });
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getDriverById(Number(req.params.id));
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Error fetching driver" });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const newDriver = await driverService.createDriver(req.body);
    res.status(201).json(newDriver);
  } catch (err) {
    res.status(500).json({ message: "Error creating driver" });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const updated = await driverService.updateDriver(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Driver not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating driver" });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const deleted = await driverService.deleteDriver(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting driver" });
  }
};

export const deleteMultipleDrivers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const count = await driverService.deleteMultipleDrivers(ids);
    res.json({ message: `${count} drivers deleted` });
  } catch (err) {
    res.status(500).json({ message: "Error deleting drivers" });
  }
};
export const checkDriverEligibility = async (req: Request, res: Response) => {
  try {
    const driverId = Number(req.params.driverId);
    if (isNaN(driverId)) {
      return res.status(200).json({ message: 'Invalid driver ID' });
    }

    const result = await driverService.evaluateDriverEligibility(driverId);

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error checking driver eligibility:', err);
    return res.status(200).json({ message: 'Internal server error' });
  }
};
// ✅ NEW: Get performance data for all drivers (with optional date filtering)
export const getDriverPerformanceData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate presence of both dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required." });
    }

    // Optional: Add date format validation here if needed

    const performanceData = await driverService.getDriverPerformanceData(
      String(startDate),
      String(endDate)
    );

   return res.json(performanceData);
  } catch (err) {
    console.error("Error fetching driver performance data:", err);
    return res.status(500).json({ message: "Failed to fetch performance data." });
  }
};


