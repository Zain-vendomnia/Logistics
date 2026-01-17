import { Unassigned } from "./hereMap.types";
import { Geometry, Tour, TourMatrix } from "./tour.types";

export type CreateTour = {
  dTour_id?: number;
  dTour_name?: string;
  tourDate: string;
  startTime: string;
  comments: string | null;
  routeColor: string;
  orderIds: number[];
  driverId: number;
  warehouseId: number;
  userId?: string;
  created_by?: string;
};

export type rejectDynamicTour_Req = {
  tour_id: number;
  userId: string;
  reason: string;
};

type TourData = {
  tour: Tour;
  unassigned: Unassigned[];
};

export interface DynamicTourPayload {
  id?: number | null;
  tour_name?: string;
  tour_route?: Geometry | null; // Geometry[]/DecodedRoute[]/object
  tour_data?: TourData;
  orderIds: string; // Comma-separated

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_town?: string;
  warehouse_colorCode?: string;

  created_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;

  approved_by?: string | null;
  approved_at?: string | null;

  matrix?: TourMatrix;
}

export type UnassignedRes = {
  orderId: number;
  order_number: string;
  reasons: string[];
};

export type DynamicTourRes = {
  tour: Tour;
  unassigned: UnassignedRes[];
  dynamicTour: DynamicTourPayload;
  // routes: DecodedRoute;
  // orderIds: string;
};

export interface WarehouseDetailsDto {
  id: number;
  name?: string;
  town: string;
  address?: string;
  zipcode?: string;
  zip_codes_delivering?: string;
  colorCode?: string;

  email?: string;
  clerkName?: string;
  clerkMob?: string;

  created_at?: string;
  updated_at?: string;
  updated_by?: string;

  vehicleCount?: number;
  capacityPerVehicle?: number;
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

// export type PinboardOrder = {
//   id: number;
//   order_number: string;

//   order_time: string;
//   delivery_time: string;

//   city: string;
//   zipcode: string;
//   street: string;

//   location: { lat: number; lng: number };
//   warehouse_id: number;
//   warehouse: string;
// };
