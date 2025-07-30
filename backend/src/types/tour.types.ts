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
  z: number;
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
  statistic: any;
  shiftIndex: number;
};