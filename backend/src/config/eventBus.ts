import EventEmitter from "events";

export enum LocalEvents {
  NEW_ORDER = "new_order",
}

export const eventBus = new EventEmitter();

export function enqueueOrder(
  orderId: number,
  priority: "high" | "normal" = "normal"
) {
  eventBus.emit(LocalEvents.NEW_ORDER, { order_id: orderId, priority });
}
