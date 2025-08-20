import { DecodedRoute, Unassigned } from "./hereMap.types";
import { Tour } from "./tour.types";

export type CreateTour = {
  tourDate: string;
  startTime: string;
  comments: string | null;
  routeColor: string;
  orderIds: number[];
  driverId: number;
  warehouseId: number;
};

export interface DynamicTourPayload {
  id?: number | null;
  tour_number?: string | null;
  tour_route?: object | null; // Geometry[]/DecodedRoute[]
  orderIds: string; // Comma-separated
  warehouse_id: number;
  approved_by?: string | null;
  approved_at?: string | null;
}

export type UnassignedRes = {
  orderId: number;
  reasons: string[];
};

export type DynamicTourRes = {
  tour: Tour;
  unassigned: UnassignedRes[];
  dynamicTour: DynamicTourPayload;
  // routes: DecodedRoute;
  // orderIds: string;
};

export interface WarehouseDetails {
  id: number;
  name: string;
  address: string;
  vehicleCount: number;
  capacityPerVehicle: number;
}

export type NotAssigned = {
  id: string;
  orderNumber: string | null;
  reason: {
    code: string;
    description: string;
  }[];
};

export type CheckOrderCount = {
  count: number;
  lastUpdated?: string; // optional if not available
};

export type pinboardOrder = {
  id: number;
  order_number: string;

  order_time: string;
  delivery_time: string;

  city: string;
  zipcode: string;
  street: string;

  location: { lat: number; lng: number };
  warehouse_id: number;
  warehouse: string;
};
