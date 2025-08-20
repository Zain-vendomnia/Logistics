import pool from "../database";
import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";
import {
  DynamicTourPayload,
  DynamicTourRes,
  UnassignedRes,
} from "../types/dto.types";
import { DecodedRoute } from "../types/hereMap.types";
import { logWithTime } from "../utils/logging";
import hereMapService from "./hereMapService";
import { getWarehouseWithVehiclesById } from "./warehouseService";

function generateTourNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TOUR-${datePart}-${randomPart}`;
}

export async function createDynamicTourAsync(
  payload: Omit<DynamicTourPayload, "tour_route">
) {
  logWithTime(`[Create Dynamic Tour]:", ${payload}`);

  if (!payload || !payload.orderIds || !payload.warehouse_id) {
    throw new Error(
      "Missing required tour data. Operation cannot be performed."
    );
  }

  const orderIds = payload.orderIds.split(",").map((o) => Number(o));
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const warehouse = await getWarehouseWithVehiclesById(payload.warehouse_id);

  const { tour, unassigned } = await hereMapService.PlanTour(orders, [
    warehouse,
  ]);

  console.log(tour, unassigned);

  // const routes: LogisticsRoute[] = await saveRouteSegments(tourId, tour);

  const routes: DecodedRoute | null = await hereMapService.getRoutesForTour(
    tour
  );

  const xOrderIds = hereMapService.extractTourOrderIds(tour);

  if (routes) {
    const dynamicTour: DynamicTourPayload = {
      ...payload,
      tour_route: routes,
      orderIds: xOrderIds,
    };

    await saveDynamicTour(dynamicTour);
  } else {
    logWithTime(`[Null Response from Here Map - Routes creation]`);
    throw Error("Null Response from Here Map - Routes creation");
  }

  const unassignedOrders: UnassignedRes[] = unassigned.map((unassigned) => ({
    orderId: Number(unassigned.jobId.split("_")[1]),
    reasons: unassigned.reasons.map((r) => `${r.code}:${r.description}`),
  }));

  const response: DynamicTourRes = {
    tour: tour,
    unassigned: unassignedOrders,
    dynamicTour: { ...payload, orderIds: xOrderIds, tour_route: routes },
  };

  return response;
}

const saveDynamicTour = async (payload: DynamicTourPayload) => {
  const {
    id,
    tour_number,
    tour_route,
    orderIds,
    warehouse_id,
    approved_by = null,
    approved_at = null,
  } = payload;

  const isNew = !id && !tour_number;

  if (isNew) {
    // Create new
    const new_tourNumber = generateTourNumber();

    const query = `
      INSERT INTO dynamic_tours (
        tour_number, tour_route, orderIds, warehouse_id, approved_by, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      new_tourNumber,
      JSON.stringify(tour_route),
      orderIds,
      warehouse_id,
      approved_by,
      approved_at,
    ];

    try {
      const [result] = await pool.execute(query, values);
      return { ...result, tour_number: new_tourNumber };
    } catch (error) {
      console.error("Error inserting dynamic tour:", error);
      throw error;
    }
  } else {
    // Update existing
    const query = `
      UPDATE dynamic_tours
      SET
        tour_route = ?,
        orderIds = ?,
        approved_by = ?,
        approved_at = ?
      WHERE ${id ? "id = ?" : "tour_number = ?"}
    `;

    const values = [
      JSON.stringify(tour_route),
      orderIds,
      approved_by,
      approved_at,
      id || tour_number,
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result;
    } catch (error) {
      console.error("Error updating dynamic tour:", error);
      throw error;
    }
  }
};

// export async function getDynamicToursAsync()
export async function getUnapprovedDynamicTours(): Promise<
  Pick<
    DynamicTourPayload,
    "id" | "tour_number" | "tour_route" | "orderIds" | "warehouse_id"
  >[]
> {
  const query =
    "SELECT id, tour_number, tour_route, orderIds, warehouse_id FROM dynamic_tours WHERE approved_at IS NULL";

  try {
    const [rows] = await pool.execute(query);

    return (rows as any[]).map((row) => ({
      id: row.id,
      tour_number: row.tour_number,
      tour_route:
        typeof row.tour_route === "string"
          ? JSON.parse(row.tour_route)
          : row.tour_route,
      orderIds: row.orderIds,
      warehouse_id: row.warehouse_id,
    }));
  } catch (error) {
    console.error("Error fetching unapproved dynamic tours:", error);
    throw error;
  }
}
