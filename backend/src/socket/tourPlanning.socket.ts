import { emitEvent } from "../config/socket";
import { DynamicTourPayload } from "../types/dto.types";

/**
 * Emit new order event to all connected clients
 * @param order - Order data
 */
export const emitNewOrder = (order: any) => emitEvent("new-order", order);

/**
 * Emit new dynamic tour event to all connected clients
 * @param dTour - Dynamic tour payload
 */
export const emitNewDynamicTour = (dTour: DynamicTourPayload) =>
  emitEvent("new-dynamic-tour", dTour);

/**
 * Emit dynamic tour update event to all connected clients
 * @param dTour - Dynamic tour data
 */
export const emitDynamicTourUpdate = (dTour: string) =>
  emitEvent("update-dynamic-tour", dTour);