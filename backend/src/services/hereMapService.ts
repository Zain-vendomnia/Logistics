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
import { LogisticOrder } from "../types/database.types";

// const warehouseGroups = [
//   {
//     warehouseAddress:
//       "WeltZiel Logistic GmbH., Rudolf-Diesel-Straße 40 , Nufringen, 71154 ", // WeltZiel Logistic GmbH
//     vehicleCount: 1,
//     capacityPerVehicle: 300,
//   },
//   //     {
//   //       warehouseAddress: "Plischka und Schmeling,Fokkerstr. 8,Schkeuditz,04435", // Plischka und Schmeling
//   //       vehicleCount: 1,
//   //       capacityPerVehicle: 1800,
//   //     },
//   //     {
//   //       warehouseAddress: 'Honer Str. 49,Eschwege,37269', // Sunniva GmbH
//   //       vehicleCount: 1,
//   //       capacityPerVehicle: 1800
//   //     },
//   //      {
//   //       warehouseAddress: 'Geis Eurocargo GmbH, Ipsheimer Straße 19, Nürnberg , 90431',
//   //       vehicleCount: 1,
//   //       capacityPerVehicle: 1800
//   //     },
//   //   {
//   //     warehouseAddress: 'Zahn Logistics GmbH, Christof-Ruthof-Weg 7, Mainz-Kastel, 55252 ',
//   //     vehicleCount: 1,
//   //     capacityPerVehicle: 1800
//   //   }
//   //   {
//   //     warehouseAddress: 'ILB Transit & Logistik GmbH & Co. KG,Bonifatiusstraße 391, Rheine, 48432',
//   //     vehicleCount: 1,
//   //     capacityPerVehicle: 1800
//   //   }
//   //    {
//   //     warehouseAddress: 'AdL Logistic GmbH, Gerlinger Str. 34, Berlin, 12349',
//   //     vehicleCount: 1,
//   //     capacityPerVehicle: 1800
//   //    },

//   //  {
//   //     warehouseAddress: 'Recht Logistik Gruppe, Weetfelder Str., Bönen, 59199',
//   //     vehicleCount: 1,
//   //     capacityPerVehicle: 1800
//   //  }
// ];

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

async function buildFleet(warehouse: any): Promise<FleetType[]> {
  const warehouseGroupObj = prepareWarehouseDto(warehouse);

  const fleet: FleetType[] = [];

  // for (const group of warehouseGroups) {
  const location = await geocode(warehouseGroupObj.warehouseAddress);

  for (let i = 0; i < warehouseGroupObj.vehicleCount; i++) {
    fleet.push({
      id: `${warehouseGroupObj.warehouseAddress.replace(/\W+/g, "_")}_vehicle_${
        i + 1
      }`,
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

  return fleet;
}

async function planTour(
  fleetTypes: FleetType[],
  jobs: DeliveryJob[]
): Promise<{ tour: Tour; unassigned: Unassigned[] }> {
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
  } catch (error) {
    logApiError(error, "planTour");
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

// const getRoutesFromTours = async (tours: Tour | Tour[]): Promise<DecodedRoute[]> => {
// const tourList =  Array.isArray(tours) ? tours : [tour];
//   const routePromises = tourList
//     .filter((tour) => (tour.stops?.length ?? 0) >= 2)
//     .map(async (tour) => {
//       try {
//         const { stops } = tour;

//         const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
//         const destination = `${stops[stops.length - 1].location.lat},${
//           stops[stops.length - 1].location.lng
//         }`;
//         const vias = stops
//           .slice(1, -1)
//           .map(
//             (stop: { location: { lat: number; lng: number } }) =>
//               `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`
//           )
//           .join("");

//         const url =
//           `https://router.hereapi.com/v8/routes?transportMode=truck` +
//           `&origin=${origin}&destination=${destination}${vias}` +
//           `&return=polyline,summary` +
//           `&truck.height=2.5&truck.length=6&truck.width=2.05` +
//           `&truck.weight=3.5&truck.axleCount=2&truck.trailerCount=1` +
//           `&apiKey=${HERE_API_KEY}`;

//         const { data } = await axios.get(url);
//         const sections = (data.routes?.[0]?.sections || []).map((sec: any) => {
//           const decoded = decode(sec.polyline).polyline;
//           return {
//             summary: sec.summary,
//             coordinates: decoded.map(([lat, lng, z]) => ({
//               lat,
//               lng,
//               z: z || 0,
//             })),
//           };
//         });

//         return {
//           vehicleId: tour.vehicleId,
//           sections,
//           stops,
//         } as DecodedRoute;
//       } catch (err) {
//         logApiError(err, `getRoutesFromTours for vehicleId=${tour.vehicleId}`);
//         return null; // Return null so others can proceed
//       }
//     });

//   const results = await Promise.all(routePromises);
//   return results.filter((route): route is DecodedRoute => route !== null);
// };

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

async function createTourAsync(orders: LogisticOrder[], warehouse: any) {
  const jobList = createJobList(orders);
  const jobs = await buildJobs(jobList);

  const fleetTypes = await buildFleet(warehouse);
  const { tour, unassigned } = await planTour(fleetTypes, jobs);

  return { tour, unassigned };

  // const decodedRoutes = await getRoutesFromTours((tours as Tour[]) || []);
  // return { routes: decodedRoutes, unassigned: unassigned };
}

const hereMapService = {
  geocode,
  createTourAsync,
  getRoutesForTour,
};

export default hereMapService;
