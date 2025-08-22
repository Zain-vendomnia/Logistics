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
  tourDate: string;
  startTime: string;
  orderIds: number[];
  driverId: number;
  warehouseId: number;
  comments: string | null;
  routeColor: string;
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

export interface Activity {
  time: TimeWindow;
  type: string; // e.g., "departure", "delivery"
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

export interface DynamicTourPayload {
  id?: number | null;
  tour_number?: string | null;
  tour_route?: Geometry[] | null; // object;
  orderIds: string; // Comma-separated
  totalOrdersItemsQty: number;

  warehouse_id: number;

  created_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;

  approved_by?: string | null;
  approved_at?: string | null;
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
