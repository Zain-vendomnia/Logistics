// controller/Admin_Api/uploadImage.controller.ts

import { Request, Response } from "express";
import { ImageFor } from "../../types/enums";
import { base64ToBuffer } from "../../utils/imageConverter";
import { insertOrUpdateImageByType } from "../../services/uploadImage.service";

export const uploadImageController = async (req: Request, res: Response) => {
  try {
    const { image_base64, image_for, reference_id } = req.body;

    if (!image_base64 || !image_for) {
      return res.status(400).json({
        message: "image_base64 and image_for are required",
      });
    }

    const imageBuffer = base64ToBuffer(image_base64);

    const result = await insertOrUpdateImageByType(
      image_for as ImageFor,
      imageBuffer,
      reference_id // can be undefined
    );

    return res.status(201).json({
      message: reference_id
        ? `Image for '${image_for}' updated successfully for reference_id '${reference_id}'`
        : `Image for '${image_for}' inserted successfully`,
      data: result,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({ message: "Failed to upload image" });
  }
};
