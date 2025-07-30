import { Request, Response } from "express";
import * as db from "../../services/DatabaseService";

import hereMapService from "../../services/HereMapService";
import { CreateTour } from "../../types/dto.types";
import { get_LogisticsOrdersAddress } from "../../model/LogisticOrders";
import { LogisticOrder } from "../../types/database.types";

export const runTourController = async (req: Request, res: Response) => {
  const tour_payload: CreateTour = req.body;
  console.log(tour_payload);
  try {
    const orders = await get_LogisticsOrdersAddress(tour_payload.orderIds);
    console.log("Order from DB - logistics WMS: ", orders);

    const tour = await db.newTourInfoMaster(tour_payload);
    console.log("Tour created:", tour);

    const result = await hereMapService.createTourAsync(
      orders as LogisticOrder[]
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Tour planning or routing failed.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
