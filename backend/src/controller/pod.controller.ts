import { Request, Response } from "express";
import { generatePODPdfAsync, sendPODPdfAsync } from "../services/pod.service";

export const generatePOD = async (req: Request, res: Response) => {
  const { tourId, orderId } = req.body;

  if (!tourId) throw new Error("Tour id required");
  if (!orderId) throw new Error("Order Number required");

  try {
    const { pdf: pdfBuffer, title } = await generatePODPdfAsync(
      Number(tourId),
      Number(orderId),
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${title}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const sendPOD = async (req: Request, res: Response) => {
  const { tourId, orderId } = req.body;

  if (!tourId) throw new Error("Tour id required");
  if (!orderId) throw new Error("Order Number required");

  try {
    await sendPODPdfAsync(Number(tourId), Number(orderId));

    res.send(true);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
