import { Order } from "../../types/order.types";
import { Warehouse } from "../../types/warehouse.types";
import { haversineKm } from "./haversineKm";

export function sortByWarehouse(
  warehouse: Warehouse,
  orders: Order[]
): Order[] {
  return [...orders].sort((a, b) => {
    const da = haversineKm(
      warehouse.lat,
      warehouse.lng,
      a.location.lat,
      a.location.lng
    );
    const db = haversineKm(
      warehouse.lat,
      warehouse.lng,
      b.location.lat,
      b.location.lng
    );
    return da - db;
  });
}
