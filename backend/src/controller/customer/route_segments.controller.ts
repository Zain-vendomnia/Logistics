import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { insertRouteSegment } from "../../services/route_segments.service";

export const addData = async (req: Request, res: Response) => {
  const imageFilename: string | undefined = req.file?.filename;

  try {
    const {
      tour_id,
      order_id,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
      status,
    } = req.body;

    // Validate required fields
    if (!tour_id || !order_id) {
      // 🧹 Cleanup file if uploaded
      if (imageFilename) {
        fs.unlinkSync(path.join("uploads/images", imageFilename));
      }

      return res.status(400).json({
        message: "tour_id and order_id are required fields",
      });
    }

    // ✅ Insert into DB (only filename is passed)
    const result = await insertRouteSegment({
      tour_id,
      order_id,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
      status,
      image: imageFilename, // Just the filename
    });

    return res.status(201).json({
      message: "Data added successfully",
      data: result,
    });

  } catch (error) {
    console.error("Error inserting route segment:", error);

    // 🧹 Cleanup file if something goes wrong
    if (imageFilename) {
      try {
        fs.unlinkSync(path.join("uploads/images", imageFilename));
      } catch (unlinkError) {
        console.error("Failed to delete uploaded file:", unlinkError);
      }
    }

    return res.status(500).json({ message: "Something went wrong while adding the data." });
  }
};
