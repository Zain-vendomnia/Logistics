// types.ts

export interface Address {
  location_id: string;
  lat: number;
  lon: number;
  snapped_waypoint: {
    lat: number;
    lon: number;
  };
}

export interface Activity {
  type: string;
  location_id: string;
  address: Address;
  arr_time: number;
  arr_date_time: string;
  end_time: number;
  end_date_time: string;
  waiting_time: number;
  distance: number;
  driving_time: number;
  preparation_time: number;
  load_before: number[];
  load_after: number[];
}

export interface Route {
  vehicle_id: string;
  shift_id: string;
  distance: number;
  transport_time: number;
  completion_time: number;
  waiting_time: number;
  service_duration: number;
  preparation_time: number;
  activities: Activity[];
}

export interface ApiResponse {
  job_id: string;
  status: string;
  solution: {
    routes: Route[];
  };
}
