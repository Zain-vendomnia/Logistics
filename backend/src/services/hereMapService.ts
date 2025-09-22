import axios from "axios";
import { decode } from "../utils/flexiblePolylineDecoder";
import {
  Location,
  WarehouseGroup,
  Job,
  FleetType,
  DeliveryJob,
  DecodedRoute,
  Unassigned,
} from "../types/hereMap.types";
import { Tour } from "../types/tour.types";
// import { LogisticOrder } from "../types/database.types";
import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";
import { getWarehouseWithVehiclesById } from "./warehouseService";

const HERE_API_KEY =
  process.env.HERE_API_KEY || "2tJpOzfdl3mgNpwKiDt-KuAQlzgEbsFkbX8byW97t1k";

const geocode = async (address: string): Promise<Location> => {
  try {
    const res = await axios.get(
      `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
        address
      )}&apiKey=${HERE_API_KEY}`
    );
    const location = res.data.items[0]?.position;
    if (!location) throw new Error(`Could not geoCode address: ${address}`);
    return location;
  } catch (error) {
    logApiError(error, "geocode");
    throw new Error("Error getting geocode.");
  }
};

export const prepareWarehouseDto = (warehouse: any) => {
  console.log("Warehouse object reveived: ", warehouse);

  const warehouseGroupObj: WarehouseGroup = {
    warehouseAddress: warehouse.address,
    vehicleCount: warehouse.vehicles.length,
    capacityPerVehicle:
      warehouse.vehicles.length > 0 ? warehouse.vehicles[0].capacity : 0,
  };
  console.log("warehouseDTO: ", warehouseGroupObj);

  return warehouseGroupObj;
};

const createJobList = (orders: LogisticOrder[]): Job[] => {
  const jobList: Job[] = orders.map((order) => {
    const address = `${order.street}, ${order.city}, ${order.zipcode}`;
    return {
      id: `job_${order.order_id}`,
      address,
      demand: 26,
    };
  });
  return jobList;
};

async function buildJobs(jobList: Job[]) {
  const deliveryJobs = jobList.map(async (job) => {
    const location = await geocode(job.address);
    return {
      id: job.id,
      tasks: {
        deliveries: [
          {
            places: [{ location, duration: 300 }],
            demand: [job.demand],
          },
        ],
      },
    } as DeliveryJob;
  });
  return await Promise.all(deliveryJobs);
}

async function buildFleet(warehouseGroups: any[]): Promise<FleetType[]> {
  const fleet: FleetType[] = [];

  for (const group of warehouseGroups) {
    const warehouseGroupObj = prepareWarehouseDto(group);
    const location = await geocode(warehouseGroupObj.warehouseAddress);

    for (let i = 0; i < warehouseGroupObj.vehicleCount; i++) {
      fleet.push({
        id: `${warehouseGroupObj.warehouseAddress.replace(
          /\W+/g,
          "_"
        )}_vehicle_${i + 1}`,
        profile: "truck",
        costs: { fixed: 50, distance: 0.02, time: 0.0015 },
        shifts: [
          {
            start: { time: "2025-06-23T07:30:00+04:00", location },
            end: { time: "2025-06-23T19:30:00+04:00", location },
          },
        ],
        capacity: [warehouseGroupObj.capacityPerVehicle],
        amount: 1,
      });
    }
  }

  return fleet;
}

// WarehouseGroup as DB object array
async function PlanTourAsync(orders: LogisticOrder[], warehouseGroup: any[]) {
  const jobList = createJobList(orders);

  const jobs = await buildJobs(jobList);

  const fleetTypes = await buildFleet(warehouseGroup);
  console.log("Fleet Types created: ", fleetTypes);

  const problem = {
    fleet: {
      types: fleetTypes,
      profiles: [{ type: "truck", name: "truck" }],
    },
    plan: { jobs },
  };

  try {
    const response = await axios.post(
      `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
      problem,
      { headers: { "Content-Type": "application/json" } }
    );

    // unwrap safely with fallback or error
    const tour = (response.data?.tours?.[0] ?? null) as Tour | null;
    const unassigned = (response.data.unassigned ?? []) as Unassigned[] | [];
    if (!tour) {
      throw new Error("No tour found in the response.");
    }

    return {
      tour,
      unassigned,
    };

    // const decodedRoutes = await getRoutesFromTours((tours as Tour[]) || []);
    // return { routes: decodedRoutes, unassigned: unassigned };
  } catch (error) {
    logApiError(error, "PlanTourAsync");
    throw new Error("Failed to plan tour.");
  }
}

async function CreateTourRouteAsync(orderIds: number[], warehouse_id: number) {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const warehouse = await getWarehouseWithVehiclesById(warehouse_id);

  const { tour, unassigned } = await PlanTourAsync(orders, [warehouse]);

  return { tour, unassigned, orders };
}

// Mock testing functions
async function buildFleet_Mock(warehouseGroups: any[]): Promise<FleetType[]> {
  const fleet: FleetType[] = [];

  for (const group of warehouseGroups) {
    const warehouseGroupObj = group as WarehouseGroup;
    const location = await geocode(warehouseGroupObj.warehouseAddress);

    for (let i = 0; i < warehouseGroupObj.vehicleCount; i++) {
      fleet.push({
        id: `${warehouseGroupObj.warehouseAddress.replace(
          /\W+/g,
          "_"
        )}_vehicle_${i + 1}`,
        profile: "truck",
        costs: { fixed: 50, distance: 0.02, time: 0.0015 },
        shifts: [
          {
            start: { time: "2025-06-23T07:30:00+04:00", location },
            end: { time: "2025-06-23T19:30:00+04:00", location },
          },
        ],
        capacity: [warehouseGroupObj.capacityPerVehicle],
        amount: 1,
      });
    }
  }

  return fleet;
}
async function PlanTourAsync_Mock(jobList: Job[], warehouseGroup: any[]) {
  const jobs = await buildJobs(jobList);

  const fleetTypes = await buildFleet_Mock(warehouseGroup);

  const problem = {
    fleet: {
      types: fleetTypes,
      profiles: [{ type: "truck", name: "truck" }],
    },
    plan: { jobs },
  };

  try {
    const response = await axios.post(
      `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
      problem,
      { headers: { "Content-Type": "application/json" } }
    );

    // unwrap safely with fallback or error
    const tours = (response.data?.tours as Tour[]) || [];
    const unassigned = (response.data.unassigned ?? []) as Unassigned[] | [];
    if (!tours.length) {
      throw new Error("No tour found in the response.");
    }
    return {
      tours,
      unassigned,
    };

    // const decodedRoutes = await getRoutesFromTours((tours as Tour[]) || []);
    // return { routes: decodedRoutes, unassigned: unassigned };
  } catch (error) {
    logApiError(error, "PlanTourAsync");
    throw new Error("Failed to plan tour.");
  }
}

async function getRoutesForTour(tour: Tour): Promise<DecodedRoute | null> {
  if ((tour.stops?.length ?? 0) < 2)
    throw new Error("Tour stops are insufficient for rounte segmentation");

  try {
    const { stops } = tour;

    const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
    const destination = `${stops[stops.length - 1].location.lat},${
      stops[stops.length - 1].location.lng
    }`;
    const vias = stops
      .slice(1, -1)
      .map(
        (stop: { location: { lat: number; lng: number } }) =>
          `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`
      )
      .join("");

    const url =
      `https://router.hereapi.com/v8/routes?transportMode=truck` +
      `&origin=${origin}&destination=${destination}${vias}` +
      `&return=polyline,summary` +
      `&truck.height=2.5&truck.length=6&truck.width=2.05` +
      `&truck.weight=3.5&truck.axleCount=2&truck.trailerCount=1` +
      `&apiKey=${HERE_API_KEY}`;

    const { data } = await axios.get(url);

    const sections = (data.routes?.[0]?.sections || []).map((sec: any) => {
      const decoded = decode(sec.polyline).polyline;
      return {
        summary: sec.summary,
        coordinates: decoded.map(([lat, lng, z]) => ({
          lat,
          lng,
          z: z || 0,
        })),
      };
    });

    return {
      vehicleId: tour.vehicleId,
      sections,
      stops,
    } as DecodedRoute;
  } catch (err) {
    logApiError(err, `getRoutesFromTours for vehicleId=${tour.vehicleId}`);
    return null;
  }
}

function extractTourOrderIds(tour: Tour): string {
  const ids: number[] = [];

  tour.stops.forEach((stop) => {
    stop.activities.forEach((act) => {
      if (act.jobId.includes("_")) {
        const parts = act.jobId.split("_");
        const idPart = parts[1];
        if (!isNaN(Number(idPart))) {
          ids.push(Number(idPart));
        }
      }
    });
  });

  return [...new Set(ids)].join(",");
}

const hereMapService = {
  geocode,
  getRoutesForTour,
  // PlanTour: PlanTourAsync,
  CreateTourRouteAsync,

  extractTourOrderIds,

  PlanTourAsync_Mock,
};

export default hereMapService;

function logApiError(error: Error | string | unknown, source: string): void {
  let message = "Unknown error";
  let stack = "";
  let statusCode = 0;

  if (axios.isAxiosError(error)) {
    message = error.message;
    stack = error.stack ?? "";
    statusCode = error.response?.status ?? 0;
  } else if (error instanceof Error) {
    message = error.message;
    stack = error.stack ?? "";
  }

  console.error(`[HereMapService] API error in ${source}`, {
    statusCode,
    message,
    stack,
  });
}
