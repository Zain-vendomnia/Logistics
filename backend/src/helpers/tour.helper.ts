import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";
import { matrixEstimate } from "../services/hereMap.service";
import { Order } from "../types/order.types";
import { LocationMeta } from "../types/tour.types";
import { Warehouse } from "../types/warehouse.types";
import { logWithTime } from "../utils/logging";

export async function getWarehouseToOrdersMetrix(
  warehouse: Warehouse,
  orders: Order[]
) {
  try {
    console.log(`Begin Matrix Call --------------------- 1`);
    console.log(
      `Warehouse ${warehouse.id} Orders ${orders.map((o) => o.order_id)}`
    );

    const origins: LocationMeta[] = [
      {
        lat: warehouse.lat!,
        lng: warehouse.lng!,
        area: warehouse.town!,
        zipcode: warehouse.zipcode!,
      },
    ];
    const destinations: LocationMeta[] = orders.map((o) => ({
      lat: o.location.lat!,
      lng: o.location.lng!,
      area: o.city!,
      zipcode: o.zipcode!,
    }));

    console.log(`Matrix Request send --------------------- 2`);
    const matrixRes = await matrixEstimate(origins, destinations);

    console.log(`Matrix Response --------------------- 3`);
    console.log(
      `Matrix from WH ${warehouse.id} to ${orders.length} orders:`,
      matrixRes
    );

    debugger;

    // total duration ≈ max travel time from warehouse to farthest destination
    const tourDurationSec = Math.max(
      ...matrixRes.estimates.map((e) => e.duration ?? 0)
    );

    return { matrixRes, tourDurationSec };
  } catch (error) {
    logWithTime(`Error in getWarehouseToOrdersMetrix: ${error}`);
    throw error;
  }
}

export async function generateTourName(orderIds: number[]): Promise<string> {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const zipcodePrefixes = Array.from(
    new Set(orders.map((o) => o.zipcode?.substring(0, 2) || "00"))
  );

  const zipcodeString = zipcodePrefixes.join("-");
  return `PLZ-${zipcodeString}`;
}
