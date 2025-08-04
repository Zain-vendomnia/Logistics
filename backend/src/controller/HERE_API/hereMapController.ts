import { Request, Response } from "express";
import hereMapService from "../../services/hereMapService";
import { CreateTour } from "../../types/dto.types";
import { LogisticOrder } from "../../types/database.types";
import { get_LogisticsOrdersAddress } from "../../model/LogisticOrders";

export const hereMapController = async (req: Request, res: Response) => {
  try {
    const tour_payload: CreateTour = req.body;

    const orders = (await get_LogisticsOrdersAddress(
      tour_payload.orderIds
    )) as LogisticOrder[];

    const warehouse: any = {};

    const { tour, unassigned } = await hereMapService.createTourAsync(orders, warehouse);

    const decodedRoutes = await hereMapService.getRoutesForTour(tour || []);
    console.log("decodedRoutes: ", decodedRoutes);

    // Cache and DB Save
    res.json({ routes: decodedRoutes, unassigned: unassigned });
  } catch (err) {
    res.status(500).json({
      message: "Tour planning or routing failed.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
