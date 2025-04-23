import { Request, Response } from "express";
import { insertRouteSegment,getRouteSegmentImage } from "../../services/route_segments.service";

export const addData = async (req: Request, res: Response) => {
  try {
    const {
      tour_id,
      order_id,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
      status,
      image_base64, // Expecting this in the body
    } = req.body;

    console.log("Received data:", req.body);

    // Validate required fields
    if (!tour_id || !order_id) {
      return res.status(400).json({
        message: "tour_id and order_id are required fields",
      });
    }

    // Convert base64 to buffer if image is provided
    let imageBuffer: Buffer | null = null;
    if (image_base64 && Array.isArray(image_base64) && image_base64.length > 0) {
      try {
        const base64String = image_base64[0]; // Take the first image only
        const base64Data = base64String.includes(",")
          ? base64String.split(",")[1]
          : base64String;
    
        imageBuffer = Buffer.from(base64Data, "base64");
      } catch (err) {
        console.error("Base64 conversion error:", err);
        return res.status(400).json({
          message: "Invalid base64 image format",
        });
      }
    }
    

    // Insert into database
    const result = await insertRouteSegment({
      tour_id,
      order_id,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
      status,
      image: imageBuffer,
    });

    return res.status(201).json({
      message: "Data added successfully",
      data: result,
    });

  } catch (error) {
    console.error("❌ Error inserting route segment:", error);

    return res.status(500).json({
      message: "Something went wrong while adding the data.",
    });
  }
};

export const getImageById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const imageBuffer = await getRouteSegmentImage(id);

    if (!imageBuffer) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Convert Buffer to base64
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    return res.status(200).json({
      id,
      image_base64: base64Image,
    });
  } catch (err) {
    console.error("❌ Error retrieving image:", err);
    return res.status(500).json({ message: "Error retrieving image" });
  }
};