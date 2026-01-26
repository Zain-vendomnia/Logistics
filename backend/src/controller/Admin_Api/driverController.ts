import { Request, Response } from "express";
import * as driverService from "../../services/driverService";

import pool from "../../config/database";

import path from "path";

export const getAllDrivers = async (_req: Request, res: Response) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching drivers" });
  }
};
function logWithTime(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export const getAvailableDriversByDateAndWarehouse = async (req: Request, res: Response) => {
  try {
    const { tourDate, warehouseId } = req.query;
    logWithTime(`Fetching available drivers for date: ${tourDate}, warehouseId: ${warehouseId}`);
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

export const disableDriver = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await driverService.disableDriver(id);

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

export const disableMultipleDrivers = async (req: Request, res: Response) => {
 try {
     const { ids } = req.body;
     const validIds = Array.isArray(ids) ? ids.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0) : [];
 
     if (validIds.length === 0) {
       return res.status(200).json({
         status: "error",
         message: "No valid warehouse IDs provided",
       });
     }
 
     const result = await driverService.disableMultipleDrivers(validIds);
 
     return res.status(200).json(result);
   } catch (err) {
     return res.status(200).json({
       status: "error",
       message: "Error disabling warehouses",
       error: err instanceof Error ? err.message : String(err),
     });
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
    const { startDate, endDate , driver_id } = req.query;

    // Validate presence of both dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required." });
    }

    // Optional: Add date format validation here if needed

    const performanceData = await driverService.getDriverPerformanceData(
      String(startDate),
      String(endDate),
      driver_id ? Number(driver_id) : undefined
    );

   return res.json(performanceData);
  } catch (err) {
    console.error("Error fetching driver performance data:", err);
    return res.status(500).json({ message: "Failed to fetch performance data." });
  }
};
export const weeklyDriverPerformanceData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate , driver_id } = req.query;

    // Validate presence of both dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required." });
    }

    // Optional: Add date format validation here if needed

    const performanceData = await driverService.getDriverPerformanceWeekDaily(
      String(startDate),
      String(endDate),
      driver_id ? Number(driver_id) : undefined
    );

   return res.json(performanceData);
  } catch (err) {
    console.error("Error fetching driver performance data:", err);
    return res.status(500).json({ message: "Failed to fetch performance data." });
  }
};


export const startTrip = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const tripData = req.body.tripData ? JSON.parse(req.body.tripData) : null;
    const mileageValue = req.body.mileageValue
      ? JSON.parse(req.body.mileageValue)
      : null;

    const images = (req.files as Express.Multer.File[]) || [];

    if (!tripData) {
      return res.status(400).json({ message: "Trip data missing" });
    }

    const tourId = tripData.checklist[0]?.tour_id;
    if (!tourId) {
      return res.status(400).json({ message: "Tour ID missing" });
    }

    /* -------------------------------
       BEGIN TRANSACTION
    --------------------------------*/
    await connection.beginTransaction();

    /* 1️⃣ SAVE MILEAGE VALUE */
    if (mileageValue !== null) {
      await connection.query(
        `UPDATE tourinfo_master 
         SET tour_start_km = ? 
         WHERE id = ?`,
        [mileageValue, tourId]
      );
    }

    /* 2️⃣ SAVE IMAGES */
    for (let i = 0; i < tripData.checklist.length; i++) {
      const item = tripData.checklist[i];
      const file = images[i];

      if (!file) continue;

      const filePath = path.join("uploads", file.originalname); // ✅ use filename

      const type =
        item.imageType === "mileageTripStart"
          ? "mileageTripStart"
          : "loadCargoTripStart";

      await connection.query(
        `INSERT INTO tour_images (tour_id, type, image)
         VALUES (?, ?, ?)`,
        [tourId, type, filePath]
      );
    }

    /* -------------------------------
       COMMIT TRANSACTION
    --------------------------------*/
    await connection.commit();

    return res.status(200).json({
      message: "Trip started successfully",
      tourId,
      mileageValue,
      imagesCount: images.length,
    });

  } catch (error) {
    /* -------------------------------
       ROLLBACK ON ERROR
    --------------------------------*/
    await connection.rollback();
    console.error("Transaction failed:", error);

    return res.status(500).json({
      error: "Failed to start trip: "+error,
    });

  } finally {
    connection.release();
  }
};



