// services/uploadImage.service.ts

import pool from "../database";
import { ImageFor } from "../enums";

export const insertOrUpdateImageByType = async (
  imageFor: ImageFor,
  imageBuffer: Buffer,
  referenceId?: string // now optional
) => {
 
  let query = "";
  let params: any[] = [];

  switch (imageFor) {
    case ImageFor.Speedometer:
      if (referenceId) {
        query = `
          INSERT INTO speedometer_images (order_id, image) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE image = VALUES(image)
        `;
        params = [referenceId, imageBuffer];
      } else {
        query = `
          INSERT INTO speedometer_images (image) VALUES (?)
        `;
        params = [imageBuffer];
      }
      break;

    case ImageFor.Delivery:
      if (referenceId) {
        query = `
          INSERT INTO route_segments (id, delivered_item_pic) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE delivered_item_pic = VALUES(delivered_item_pic)
        `;
        params = [referenceId, imageBuffer];
      } else {
        query = `
          INSERT INTO route_segments (delivered_item_pic) VALUES (?)
        `;
        params = [imageBuffer];
      }
      break;

    case ImageFor.Neighbors:
      if (referenceId) {
        query = `
          INSERT INTO neighbor_images (neighbor_id, image) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE image = VALUES(image)
        `;
        params = [referenceId, imageBuffer];
      } else {
        query = `
          INSERT INTO neighbor_images (image) VALUES (?)
        `;
        params = [imageBuffer];
      }
      break;

    default:
      throw new Error(`Invalid imageFor type: ${imageFor}`);
  }

  const [result] = await pool.query(query, params);
  return result;
};
