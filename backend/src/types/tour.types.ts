import { Statistic } from "./hereMap.types";
import { Order } from "./order.types";

export type RouteResponse = {
  from: any;
  to: any;
  distance_to: number;
  driving_time_to: number;
  geometry: any;
  order_id: string;
};
// ************************

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface TimeWindow {
  start: string; // ISO timestamp
  end: string;
}

export interface Activity {
  jobId: string;
  type: "departure" | "arrival" | "delivery" | string;
  // string specifies job for order_id; job_38, job_39
  location: LocationPoint;
  time: TimeWindow;
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

export interface SectionSummary {
  length: number; // in meters
  duration: number; // in seconds
  baseDuration: number; // in seconds
}

export interface Coordinate {
  lat: number;
  lng: number;
  z?: number;
}

export interface Section {
  summary: SectionSummary;
  coordinates: Coordinate[];
}

export interface Geometry {
  vehicleId: string;
  sections: Section[]; // would have 1 object normally
  stops: Stop[];
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
  statistic: Statistic;
  shiftIndex: number;
};

export enum TourType {
  dynamicTour = "dynamic_tours",
  masterTour = "tourinfo_master",
}
export enum TourStatus {
  rejected = "rejected",
  approved = "approved",
  pending = "pending",
  live = "live",
  completed = "completed",
}

export type TourTracePayload = {
  source_table: TourType;
  source_id: number;
  tour_name: string;
  tour_route: object; // JSON
  tour_data: object; // JSON
  orderIds: string; // comma-separated string
  warehouse_id: number;
  status: TourStatus;
  removed_reason?: string;
  removed_by?: string;
};

export type DeliveryCostRates = {
  personnel_costs_per_hour: number;
  diesel_costs_per_liter: number;
  consumption_l_per_100km: number;
  van_costs_per_day: number;

  storage_cost_per_BKW: number;
  bkw_per_tour: number;
  avg_tour_duration_hrs: number;
  avg_tour_length_km: number;
  avg_number_tour_days: number;

  hotel_costs: number;
  WA: number;
  WE: number;
  infeed: number;
  panels_per_pallet: number;

  handling_inbound_cost_tour?: number;
  handling_inbound_cost_panel?: number;
  handling_outbound_cost_pal?: number;
  handling_outbound_costs_tour?: number;
  currency_code?: "EUR" | "USD";
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

export type TourinfoMaster = {
  id: number;
  tour_name: string;
  tour_status: string;
  orderIds: string;

  tour_date: Date;
  start_time: string;
  end_time: string;

  tour_route: JSON;
  route_color: string;

  item_total_qty_truck: number;
  total_weight_kg?: number;
  total_distance_km?: number;
  total_duration_hrs?: number;

  comments?: string;
  customer_ids?: string;

  truck_loaded_img?: Blob;
  tour_end_truck_qty_pic?: Blob;
  tour_end_fuel_pic?: Blob;

  tour_start_km?: number;
  tour_end_km?: number;
  excepted_tour_total_km?: number;
  tour_start_fuel_pic?: Blob;

  created_at: Date;
  updated_at?: Date;
  updated_by?: string;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_address?: string;
  warehouse_town?: string;
  warehouse_colorCode?: string;
  warehouse_zip_codes_delivering?: string;
  warehouse_zip_code?: string;

  vehicle_id: number;
  vehicle_name?: string;
  vehicle_registration?: string;
  vehicle_capacity?: string;

  driver_id: number;
  driver_name?: string;
  driver_phone?: string;

  matrix_id?: number;
  matrix?: TourMatrix;

  orders?: Order[];
};

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
