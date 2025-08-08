import { Request, Response } from "express";
import { syncShopwareOrder } from "../../services/orderSync.service";

/**
 * Controller: Receives order data from Shopware and triggers DB sync
 * Route: POST /api/admin/order-sync
 */
export const orderSyncFromShopwareController = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;

    // ✅ Step 1: Basic validation
    if (!orderData[0] || !orderData[0].orderID || !Array.isArray(orderData[0].OrderDetails)) {
      console.warn("⚠️ Invalid order payload received from Shopware", orderData);
      return res.status(400).json({ message: "Invalid order data" });
    }

    // ✅ Step 2: Sync order using service
    const result = await syncShopwareOrder(orderData[0]);

    // ✅ Step 3: Respond based on result
    if (!result.updated) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderData[0].orderID} not found in DB. Update skipped.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order ${orderData[0].orderID} updated successfully.`,
    });

  } catch (error: any) {
    console.error(`❌ Error while syncing order ${req.body?.orderID || "unknown"}:`, error.message);
    return res.status(500).json({
      success: false,
      message: `Order sync failed: ${error.message}`,
    });
  }
};
