import { OrderType } from "../../model/LogisticOrders";
import { Order } from "../../types/order.types";

export const isUrgent = (o: Order) => o.type === OrderType.URGENT;
export const isPickup = (o: Order) => o.type === OrderType.PICKUP;
export const isPriority = (o: Order) => isUrgent(o) || isPickup(o);

export const effectiveWeight = (o: Order) =>
  isPickup(o) ? 0 : o.weight_kg ?? 0;
