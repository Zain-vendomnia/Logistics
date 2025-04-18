import { Request, Response } from "express";
import { fetchWmsOrder } from "../../services/scheduleWmsOrderInfo.service";
import dayjs from "dayjs";

export const scheduleWmsOrderController = async (_: Request, res: Response) => {
  try {
    // const from = `${dayjs().format("YYYY-MM-DD")} 00:00:00`; // ✅ Today's START date
    const from = "2025-03-29 00:00:00"; // ✅ Static start date
    const to = `${dayjs().format("YYYY-MM-DD")} 23:59:59`; // ✅ Today's end date

    console.log("📅 Fetching WMS orders from:", from, "to:", to);

    const orders = await fetchWmsOrder(from, to);

    return res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching scheduled WMS orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
