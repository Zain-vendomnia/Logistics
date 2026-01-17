import { n } from "framer-motion/dist/types.d-Cjd591yU";
import { number } from "yup";
import { Order } from "./order.type";

export type NotAssigned = {
  id: string;
  orderNumber: string | null;
  reason: {
    code: string;
    description: string;
  }[];
};

export interface CreateTour_Res {
  tour: string; // tourName
  routes: LogisticsRoute[];
  notAssigned: NotAssigned[];
  unassigned: string;
  message: string;
}

export type CreateTour_Req = {
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
};

export type UpdateTour_Req = {
  id: number;
  tourName?: string;
  tourDate: string;
  startTime: string;
  routeColor: string;
  orderIds: number[];
  driverId: number;
  vehicleId: number;
  warehouseId: number;
  userId: string;
  comments: string | null;
};

export type TourData = {
  routePolyline: [number, number][];
  stops: Stop[];
};

// export type Stop = {
//   location: { lat: number; lng: number };
//   time: { arrival: string; departure: string };
//   activities: { jobId: string; type: string }[];
// };

// ******************

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface TimeWindow {
  start: string; // ISO timestamp
  end: string;
}

export interface SectionSummary {
  length: number; // in meters
  duration: number; // in seconds
  baseDuration: number; // in seconds
}

export interface Coordinate {
  lat: number;
  lng: number;
  z: number;
}

export interface Section {
  summary: SectionSummary;
  // coordinates: Coordinate[];
  coordinates: [number, number][];
}

export interface Geometry {
  vehicleId: string;
  sections: Section[]; // would have 1 object normally
  stops: Stop[];
}

export interface Activity {
  time: TimeWindow;
  type: string; // e.g., "departure", "delivery", "arrival"
  jobId: string;
  location: LocationPoint;
}

export interface Stop {
  load: number[];
  time: {
    arrival: string;
    departure: string;
  };
  distance: number;
  location: LocationPoint;
  activities: Activity[];
}

export interface RouteLeg {
  lat: number;
  lon: number;
  location_id: string;
  arr_time: string; // ISO timestamp
  arr_date_time: string; // ISO timestamp
}

export interface LogisticsRoute {
  to: RouteLeg;
  from: RouteLeg;
  geometry: Geometry;
  order_id: string;
  distance_to: number;
  driving_time_to: number;
}

export type Tour = {
  vehicleId: string;
  typeId: string;
  stops: Stop[];
  statistic: any;
  shiftIndex: number;
};

export interface TourMatrix {
  tourId: number;
  totalOrdersItemsQty?: number;
  totalOrdersArticlesQty?: number;
  pickUpsQty?: number;

  totalWeightKg: number;
  totalDistanceKm: number;
  totalDurationHrs: number;
  costPerStop: number;
  costPerArticle: number;
  costPerSLMD: number;
  totalCost: number;
  hotelCost: number;
  vanTourCost: number;
  dieselTourCost: number;
  personnelTourCost: number;
  warehouseTourCost: number;
  infeedTourCost: number;
  costWE: number;
  costWA: number;
}
export interface DynamicTourPayload {
  id?: number;
  tour_name?: string;
  tour_route?: Geometry | null; // object;
  orderIds: string; // Comma-separated

  total_weight_kg?: number;
  toal_distance_km?: number;
  total_duration_hrs?: number;

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
export interface Tourinfo {
  id: number;
  tour_name?: string;
  status?: string;
  orderIds: string; // Comma-separated

  tour_date: string;
  start_time?: string;
  end_time?: string;

  tour_route?: Geometry | null; // object;
  route_color?: string | null;

  comments?: string | null;
  customer_ids?: string;

  item_total_qty_truck: number;
  total_weight_kg?: number;
  total_distance_km?: number;
  total_duration_hrs?: number;

  created_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_address?: string;
  warehouse_town?: string;
  warehouse_colorCode?: string;
  warehouse_zip_codes_delivering?: string;
  warehouse_zip_code?: string;

  vehicle_id: number;
  capacity_kg?: string;
  vehicle_registration?: string;
  vehicle_capacity?: string;

  driver_id: number;
  driver_name?: string;
  driver_phone?: string;

  matrix_id?: number;
  matrix?: TourMatrix;

  orders?: Order[];
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
};

export type rejectDynamicTour_Req = {
  tour_id: number;
  userId: string;
  reason: string;
};

export enum TourStatus {
  rejected = "rejected",
  approved = "approved",
  pending = "pending",
  live = "live",
  completed = "completed",
}

export type TourRow = {
  id: number;
  tour_name: string;
  tour_date: string;
  status: TourStatus;
  route_color: string | null;
  comments: string | null;

  orderIds: number[];
  driver_id: number;
  driver_name: string;
  vehicle_id: number;
  warehouse_id: number;
  warehouse_colorCode?: string;
};
