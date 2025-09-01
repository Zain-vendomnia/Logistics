import { Request, Response } from 'express';
import { getNotificationData } from "../../services/notificationMeta.service";

export const getOrderNotificationMetaData = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.body;

    // Pass the orderNumber directly to getNotificationData function
    const result = await getNotificationData(orderNumber);

    return res.status(200).json({
      message: "success",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error getting notification meta data:", error);

    return res.status(500).json({
      message: "Something went wrong while getting the notification data.",
    });
  }
};
