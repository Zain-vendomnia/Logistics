import pool from "../database";
import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
  OrderStatus,
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

async function generateTourNumber(orderIds: number[]): Promise<string> {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const zipcodePrefixes = Array.from(
    new Set(orders.map((o) => o.zipcode?.substring(0, 2) || "00"))
  );

  const zipcodeString = zipcodePrefixes.join("-");
  return `PLZ-${zipcodeString}`;
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
  const order_number_map = new Map<number, string>(
    orders.map((o) => [o.order_id, o.order_number])
  );

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
      tour_data: { tour, unassigned },
      tour_route: routes,
      orderIds: xOrderIds,
    };

    await saveDynamicTour(dynamicTour);

    const order_ids = xOrderIds.split(",").map((o) => Number(o));
    await LogisticOrder.updateOrdersStatus(order_ids, OrderStatus.assigned);
  } else {
    logWithTime(`[Null Response from Here Map - Routes creation]`);
    throw Error("Null Response from Here Map - Routes creation");
  }

  const unassignedOrders: UnassignedRes[] = unassigned.map((unassigned) => {
    const order_id = Number(unassigned.jobId.split("_")[1]);
    return {
      orderId: order_id,
      order_number: order_number_map.get(order_id) ?? "",
      reasons: unassigned.reasons.map((r) => `${r.code}:${r.description}`),
    };
  });

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
    tour_data,
    orderIds,
    warehouse_id,
    approved_by = null,
    approved_at = null,
    updated_by = null,
  } = payload;

  const isNew = !id && !tour_number;
  if (isNew) {
    // Create new
    const order_ids = orderIds.split(",").map((o) => Number(o));
    const new_tourNumber = await generateTourNumber(order_ids);

    const query = `
      INSERT INTO dynamic_tours (
        tour_number, tour_route, tour_data, orderIds, warehouse_id, approved_by, approved_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      new_tourNumber,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data),
      orderIds,
      warehouse_id,
      approved_by,
      approved_at,
      updated_by,
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
      tour_number = ?,
        tour_route = ?,
        tour_data = ?,
        orderIds = ?,
        approved_by = ?,
        approved_at = ?,
        updated_by = ?
      WHERE ${id ? "id = ?" : "tour_number = ?"}
    `;

    const values = [
      tour_number,
      JSON.stringify(tour_route),
      JSON.stringify(tour_data ?? {}),
      orderIds,
      approved_by,
      approved_at,
      updated_by,
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
  DynamicTourPayload[]
> {
  const query = "SELECT * FROM dynamic_tours WHERE approved_at IS NULL";
  // "SELECT id, tour_number, tour_route, orderIds, warehouse_id FROM dynamic_tours WHERE approved_at IS NULL";

  try {
    const [rows] = await pool.execute(query);

    const dTours = (rows as DynamicTourPayload[]).map((row) => ({
      id: row.id,
      tour_number: row.tour_number,
      tour_route:
        typeof row.tour_route === "string"
          ? JSON.parse(row.tour_route)
          : row.tour_route,
      orderIds: row.orderIds,
      totalOrdersItemsQty: 0,
      warehouse_id: row.warehouse_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
    }));

    for (const tour of dTours) {
      const order_ids = tour.orderIds.split(",");
      tour.totalOrdersItemsQty = await LogisticOrder.getOrderItemsCount(
        order_ids
      );
    }

    return dTours;
  } catch (error) {
    console.error("Error fetching unapproved dynamic tours:", error);
    throw error;
  }
}
