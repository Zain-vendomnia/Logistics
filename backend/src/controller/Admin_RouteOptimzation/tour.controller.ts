import { Request, Response } from "express";
import { deleteTours, updateTour } from "../../model/tourModel";
import { tourInfo_master } from "../../model/TourinfoMaster";
// import { createRoutedata } from "../../services/createRoutedata";
import { route_segments } from "../../model/routeSegments";
import pool from "../../config/database";
import { CreateTour } from "../../types/dto.types";
import { ResultSetHeader } from "mysql2";
import * as tourService from "../../services/tour.service";
import { logWithTime } from "../../utils/logging";
import logger from "../../config/logger";

export const createTourController = async (req: Request, res: Response) => {
  const tour_payload: CreateTour = req.body;

  logWithTime(`[Create Tour Request]: ${tour_payload}`);
  try {
    const result = await tourService.getTourMapDataAsync(tour_payload);
    if (!result) {
      res.status(500).json({ message: "Failed to create the tour" });
    }
    res.status(200).json({ ...result, message: "Tour saved successfully" });
  } catch (error) {
    console.error("Error saving tour:", error);
    if (error instanceof Error) {
      if (error.message.includes("Driver already has a tour")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: "An unexpected error occurred while saving the tour.",
      });
    }
  }
};

export const getTourcountcheck = async (_req: Request, res: Response) => {
  try {
    const orders = await tourInfo_master.getAllToursCount();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getgraphhopperRoute = async (_req: Request, res: Response) => {
  const { tour_id } = _req.body;
  if (!tour_id) {
    return res.status(400).json({ message: "Tour ID is required." });
  }
  try {
    const routeRes = await tourInfo_master.getRouteResponse(
      parseInt(tour_id as string)
    );
    res.status(200).json(routeRes);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSegmentRoutes = async (_req: Request, res: Response) => {
  const { tour_id } = _req.body;
  if (!tour_id) {
    return res.status(400).json({ message: "Tour ID is required." });
  }
  try {
    const routeRes = await route_segments.getRoutesegmentRes(Number(tour_id));
    res.status(200).json(routeRes);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTourController = async (req: Request, res: Response) => {
  console.log("[deleteTourController] Request received to delete tours");

  try {
    const { tourIds } = req.body;
    console.log("[deleteTourController] Tour IDs to delete:", tourIds);

    if (!tourIds || !Array.isArray(tourIds)) {
      console.error("[deleteTourController] Invalid tour IDs provided");
      return res.status(400).json({ message: "Tour IDs must be an array" });
    }

    if (tourIds.length === 0) {
      console.error("[deleteTourController] Empty tour IDs array provided");
      return res.status(400).json({ message: "No tour IDs provided" });
    }

    const result = await deleteTours(tourIds);
    const affectedRows = (result as ResultSetHeader).affectedRows;

    console.log("[deleteTourController] Delete result:", result);

    if (affectedRows > 0) {
      console.log(
        `[deleteTourController] Successfully deleted ${affectedRows} tours`
      );
      res.status(200).json({
        message: "Tours deleted successfully",
        deletedCount: affectedRows,
      });
    } else {
      console.error("[deleteTourController] No tours found to delete");
      res.status(404).json({ message: "No tours found to delete" });
    }
  } catch (error) {
    console.error("[deleteTourController] Error:", error);
    res.status(500).json({
      message: "Error deleting tours",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateTourController = async (req: Request, res: Response) => {
  const { id, tourName, comments, startTime, driverid, routeColor, tourDate } =
    req.body;

  if (!id) {
    return res.status(400).json({ message: "Tour ID is required for update" });
  }

  if (
    !tourName ||
    !comments ||
    !startTime ||
    !driverid ||
    !routeColor ||
    !tourDate
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required for the update" });
  }

  try {
    const result = await updateTour({
      id,
      tourName,
      comments,
      startTime,
      driverid,
      routeColor,
      tourDate,
    });

    const affectedRows = (result as ResultSetHeader).affectedRows;

    if (affectedRows > 0) {
      return res.status(200).json({ message: "Tour updated successfully" });
    } else {
      return res
        .status(404)
        .json({ message: "Tour not found or no changes made" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error updating tour",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTourstatus = async (_req: Request, res: Response) => {
  try {
    const tourCompletedIds = await tourInfo_master.getAllTourstatus();
    console.log("tourCompletedIds" + JSON.stringify(tourCompletedIds));
    res.status(200).json(tourCompletedIds);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getTourDetails = async (_req: Request, res: Response) => {
  try {
    const { tourId } = _req.query;
    console.log("tour_id: " + tourId);

    if (!tourId)
      return res.status(400).json({ message: "Tour ID is required" });

    const result = await tourService.getTourDetailsById(Number(tourId));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatetourstatus = async (_req: Request, res: Response) => {
  const { tourId } = _req.params;
  console.log("tour_id" + tourId);
  try {
    await pool.query(
      "UPDATE tourinfo_master SET tour_status = ? WHERE id = ?",
      ["confirmed", tourId]
    );
    console.log(`Updating tour ${tourId} to 'confirmed'`);
    res.status(200).json({ message: "Tour status updated to confirmed." });
  } catch (error) {
    console.error("Error updating tour status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRoutesSegmentImages = async (_req: Request, res: Response) => {
  const { tour_id, order_number } = _req.body;

  // Require at least one of tour_id or order_number
  if (!tour_id || !order_number) {
    return res.status(400).json({
      message: "At least one of tour_id or order_number is required.",
    });
  }

  try {
    const routeRes = await route_segments.getRoutesegmentImagesRes(
      tour_id ? Number(tour_id) : undefined,
      order_number ? order_number : undefined
    );

    res.status(200).json(routeRes);
  } catch (error) {
    logger.error("Error fetching images:", error);
    res
      .status(404)
      .json({ message: "Images not found for the provided criteria." });
  }
};

export const estimateTourCostMatrix = async (_req: Request, res: Response) => {
  const { warehouseId, orderIds } = _req.body;

  if (!warehouseId || !orderIds) {
    return res.status(400).json({
      message: "Invalid data provided",
    });
  }

  try {
    const result = await tourService.estimateTourCostMatrixAsync(
      warehouseId,
      orderIds
    );

    if (!result) {
      return res
        .status(204)
        .json({ success: false, message: "No matrix result returned." });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error estimating tour cost matrix:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error estimating tour cost matrix.",
      error: error instanceof Error ? error.message : error,
    });
  }
};
