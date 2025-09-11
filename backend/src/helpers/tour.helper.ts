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

    const matrixRes = await matrixEstimate(origins, destinations);

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
