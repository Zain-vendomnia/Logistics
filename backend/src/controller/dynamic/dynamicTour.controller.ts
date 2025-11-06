import { Request, Response } from "express";
import axios from "axios";
import { decode } from "../../utils/flexiblePolylineDecoder";
import pLimit from "p-limit";
import {
  acceptDynamicTourAsync,
  createDynamicTourAsync,
  getUnapprovedDynamicTours,
  rejectDynamicTourAsync,
} from "../../services/dynamicTour.service";
import { logWithTime } from "../../utils/logging";
import {
  CreateTour,
  DynamicTourPayload,
  DynamicTourRes,
  rejectDynamicTour_Req,
} from "../../types/dto.types";
import { LogisticOrder } from "../../model/LogisticOrders";
import { parseExcelBufferToOrders } from "../../utils/parseExcel";
import { getAllWarehouses } from "../../services/warehouse.service";

const HERE_API_KEY =
  process.env.HERE_API_KEY || "2tJpOzfdl3mgNpwKiDt-KuAQlzgEbsFkbX8byW97t1k";

const geocode = async (address: string) => {
  const res = await axios.get(
    `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
      address
    )}&apiKey=${HERE_API_KEY}`
  );
  const loc = res.data.items[0]?.position;
  if (!loc) throw new Error(`Could not geocode address: ${address}`);
  return loc;
};

const warehouseGroups = [
  {
    warehouseAddress: "Honer Str. 49,Eschwege,37269", // Sunniva GmbH
    vehicleCount: 2,
    capacityPerVehicle: 1800,
  },
  {
    warehouseAddress:
      "ILB Transit & Logistik GmbH & Co. KG,Bonifatiusstraße 391, Rheine, 48432",
    vehicleCount: 1,
    capacityPerVehicle: 1650,
  },
  {
    warehouseAddress: "NL - LOGISTICS GmbH, Halskestraße 38, Hamburg, 22113",
    vehicleCount: 1,
    capacityPerVehicle: 1700,
  } /*,
  {
    warehouseAddress: 'AdL Logistic GmbH, Gerlinger Str. 34, Berlin, 12349',
    vehicleCount: 2, // actual 2
    capacityPerVehicle: 1800
  } ,
  {
    warehouseAddress: 'WeltZiel Logistic GmbH., Rudolf-Diesel-Straße 40 , Nufringen, 71154', // WeltZiel Logistic GmbH
    vehicleCount: 2,
    capacityPerVehicle: 1700
  },
  {
    warehouseAddress: 'Plischka und Schmeling,Fokkerstr. 8,Schkeuditz,04435', // Plischka und Schmeling
    vehicleCount: 2,
    capacityPerVehicle: 1800
  }, 
  
  {
    warehouseAddress: 'Geis Eurocargo GmbH, Ipsheimer Straße 19, Nürnberg , 90431',
    vehicleCount: 1,
    capacityPerVehicle: 1800
  },
  {
    warehouseAddress: 'Zahn Logistics GmbH, Christof-Ruthof-Weg 7, Mainz-Kastel, 55252 ',
    vehicleCount: 1,
    capacityPerVehicle: 1800
  },
   {
    warehouseAddress: 'Recht Logistik Gruppe, Weetfelder Str., Bönen, 59199',
    vehicleCount: 1,
    capacityPerVehicle: 1800
  }, 
  {
    warehouseAddress: 'LINTHER SPEDITION GmbH, Kronwinkler Str. 31, Muenchen, 81245',
    vehicleCount: 1,
    capacityPerVehicle: 1800
  } */,
];

export interface Job {
  id: string;
  address: string;
  demand: number;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export const create_dynamicTour = async (
  _req: Request,
  res: Response,
  jobList: Job[]
) => {
  try {
    const fleetTypes = [];
    for (const group of warehouseGroups) {
      const location = await geocode(group.warehouseAddress);
      for (let i = 0; i < group.vehicleCount; i++) {
        fleetTypes.push({
          id: `${group.warehouseAddress.replace(/\W+/g, "_")}_vehicle_${i + 1}`,
          profile: "truck",
          costs: { fixed: 50, distance: 0.02, time: 0.0015 },
          shifts: [
            {
              start: { time: "2025-07-08T07:30:00+04:00", location },
              end: { time: "2025-07-08T19:30:00+04:00", location },
            },
          ],
          capacity: [group.capacityPerVehicle],
          amount: 1,
        });
      }
    }

    const jobChunks = chunkArray(jobList, 400);
    const allDecodedRoutes: any[] = [];
    const allUnassigned: any[] = [];

    for (const jobChunk of jobChunks) {
      const limit = pLimit(5);
      const jobs = await Promise.all(
        jobChunk.map((job) =>
          limit(async () => {
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
            };
          })
        )
      );

      const problem = {
        fleet: {
          types: fleetTypes,
          profiles: [{ type: "truck", name: "truck" }],
        },
        plan: { jobs },
      };

      const tourRes = await axios.post(
        `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
        problem,
        { headers: { "Content-Type": "application/json" } }
      );

      for (const tour of tourRes.data.tours || []) {
        const stops = tour.stops || [];
        if (stops.length < 2) {
          console.warn(`Tour has less than 2 stops: ${tour.vehicleId}`);
          continue;
        }

        const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
        const destination = `${stops[stops.length - 1].location.lat},${
          stops[stops.length - 1].location.lng
        }`;
        const vias = stops
          .slice(1, -1)
          .map(
            (stop: any) =>
              `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`
          )
          .join("");

        const url =
          `https://router.hereapi.com/v8/routes?transportMode=truck` +
          `&origin=${origin}&destination=${destination}${vias}` +
          `&return=polyline,summary` +
          `&truck.height=2.5&truck.length=6&truck.width=2.05&truck.weight=3.5` +
          `&truck.axleCount=2&truck.trailerCount=1` +
          `&apiKey=${HERE_API_KEY}`;

        try {
          const resp = await axios.get(url);
          const route = resp.data.routes?.[0];

          if (!route || !route.sections?.length) {
            console.warn(`No sections returned for vehicle ${tour.vehicleId}.`);
            continue;
          }

          const sections = route.sections.map((sec: any) => {
            const decoded = decode(sec.polyline).polyline;

            const durationSeconds = sec.summary?.duration || 0;
            const durationHoursDecimal = durationSeconds / 3600;

            const hours = Math.floor(durationHoursDecimal);
            const minutes = Math.round((durationHoursDecimal - hours) * 60);

            const lengthMeters = sec.summary?.length || 0;
            const lengthKm = lengthMeters / 1000;

            return {
              summary: {
                ...sec.summary,
                durationHours: Number(durationHoursDecimal.toFixed(2)),
                durationFormatted: `${hours}h ${minutes}m`,
                lengthKm: Number(lengthKm.toFixed(2)),
              },
              coordinates: decoded.map(([lat, lng, z]) => ({
                lat,
                lng,
                z: z || 0,
              })),
            };
          });

          allDecodedRoutes.push({
            vehicleId: tour.vehicleId,
            sections,
            stops,
          });
        } catch (routingError) {
          if (routingError instanceof Error) {
            console.error(
              `Routing failed for vehicle ${tour.vehicleId}:`,
              routingError.message
            );
          } else {
            console.error(
              `Routing failed for vehicle ${tour.vehicleId}:`,
              String(routingError)
            );
          }
        }
      }

      allUnassigned.push(...(tourRes.data.unassigned || []));
    }

    res.json({ routes: allDecodedRoutes, unassigned: allUnassigned });
    console.log("Unassigned jobs:", JSON.stringify(allUnassigned));
  } catch (err) {
    console.error("Error in dynamicTourController:", err);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Tour planning or routing failed.",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};

export const uploadOrdersFromFile = async (_req: Request, res: Response) => {
  try {
    if (!_req.file) return res.status(400).json({ error: "File is required" });

    const logisticsOrders = await LogisticOrder.getAllLogisticOrders();
    const warehouseList = await getAllWarehouses();
    const excelOrders = parseExcelBufferToOrders(
      _req.file.buffer,
      warehouseList
    );

    const createdOrderIds: number[] = [];

    for (const excelOrder of excelOrders) {
      const orderExists = logisticsOrders.some(
        (o) => o.order_number === excelOrder.order_number
      );

      if (!orderExists) {
        try {
          const orderId = await LogisticOrder.createOrderAsync(excelOrder);
          createdOrderIds.push(orderId);
        } catch (err) {
          console.error(`Order did not saved for reason: `, err);
        }
      }
    }

    console.log(`Added ${createdOrderIds.length} new Orders.`);
    console.log(
      `Skipped ${excelOrders.length - createdOrderIds.length} Orders.`
    );

    return res.json({
      message: `Processed ${createdOrderIds.length} orders successfully`,
      orderIds: createdOrderIds,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).json({ error: "Failed to process file" });
  }
};

export const createDynamicTour = async (_req: Request, res: Response) => {
  try {
    const payload: DynamicTourPayload = _req.body;

    if (!payload || !payload.orderIds || !payload.warehouse_id)
      res.status(400).json({ message: "Invalid payload" });

    const dynamicTour: DynamicTourRes = await createDynamicTourAsync(payload);

    res.json(dynamicTour);
    logWithTime(
      `[Unassigned jobs]:,
      ${JSON.stringify(dynamicTour?.unassigned)}`
    );
  } catch (err) {
    console.error("Error in dynamicTourController:", err);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Tour planning or routing failed.",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};

export const acceptDynamicTour = async (_req: Request, res: Response) => {
  try {
    const payload: CreateTour = _req.body;

    if (!payload || !payload.orderIds || !payload.warehouseId) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const dynamicTour = await acceptDynamicTourAsync(payload);

    return res.status(200).json(dynamicTour);
  } catch (err) {
    console.error("Error in Accept Dynamic Tour Controller:", err);

    return res.status(500).json({
      message: "Tour planning or routing failed.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const rejectDynamicTour = async (_req: Request, res: Response) => {
  try {
    const payload: rejectDynamicTour_Req = _req.body;

    if (!payload) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const result = await rejectDynamicTourAsync(payload);

    if (!result) {
      return res
        .status(500)
        .json({ message: "Error deleting the dynamic tour" });
    }

    return res.status(200).json({
      success: true,
      message: "Tour deleted successfully",
    });
  } catch (err) {
    console.error("Error in Reject Dynamic Tour Controller:", err);

    return res.status(500).json({
      message: "Tour rejection failed.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getDynamicTours = async (_req: Request, res: Response) => {
  try {
    const dynamic_tours = await getUnapprovedDynamicTours();

    // console.log("Returning Dynamic Tours:", dynamic_tours);

    res.status(200).json(dynamic_tours);
  } catch (error) {
    console.error("Error executing Dynamic Tours:", error);
    res.status(500).json({
      message: "Failed to get dynamic tours",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
