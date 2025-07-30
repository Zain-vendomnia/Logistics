export interface Location {
  lat: number;
  lng: number;
}

export interface WarehouseGroup {
  warehouseAddress: string;
  vehicleCount: number;
  capacityPerVehicle: number;
}

export interface Job {
  id: string;
  address: string;
  demand: number;
}

export interface FleetType {
  id: string;
  profile: string;
  costs: {
    fixed: number;
    distance: number;
    time: number;
  };
  shifts: Array<{
    start: { time: string; location: Location };
    end: { time: string; location: Location };
  }>;
  capacity: number[];
  amount: number;
}

export interface DeliveryJob {
  id: string;
  tasks: {
    deliveries: Array<{
      places: Array<{
        location: Location;
        duration: number;
      }>;
      demand: number[];
    }>;
  };
}

export interface DecodedRoute {
  vehicleId: string;
  sections: Array<{
    summary: any;
    coordinates: Array<{ lat: number; lng: number; z: number }>;
  }>;
  stops: any[];
}

// planTour>tour

export type Statistic = {
  cost: number;
  distance: number;
  duration: number;
  times: {
    driving: number;
    serving: number;
    waiting: number;
    stopping: number;
    break: number;
  };
};

// export type Tour = {
//   vehicleId: string;
//   typeId: string;
//   stops: Stop[];
//   statistic: Statistic;
//   shiftIndex: number;
// };

export type Stop = {
  load: number[];
  time: {
    arrival: string; // ISO timestamp
    departure: string; // ISO timestamp
  };
  distance: number;
  location: LatLng;
  activities: Activity[];
};

export type Activity = {
  jobId: string;
  type: "departure" | "arrival" | "delivery" | string;
  // string specifies job for order_id; job_38, job_39
  location: LatLng;
  time: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
  };
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type Unassigned = {
  jobId: string;
  reasons: {
    code: string;
    description: string;
  }[];
};
