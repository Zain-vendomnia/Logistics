import { Request, Response } from "express";
import axios from "axios";
import { decode } from "../../utils/flexiblePolylineDecoder";
import pool from "../../database";

const HERE_API_KEY = process.env.HERE_API_KEY || '2tJpOzfdl3mgNpwKiDt-KuAQlzgEbsFkbX8byW97t1k';

const geocode = async (address: string) => {
  const res = await axios.get(
    `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${HERE_API_KEY}`
  );
  const loc = res.data.items[0]?.position;
  if (!loc) throw new Error(`Could not geocode address: ${address}`);
  return loc;
};

const warehouseGroups = [
    {
      warehouseAddress: 'WeltZiel Logistic GmbH., Rudolf-Diesel-Straße 40 , Nufringen, 71154 ', // WeltZiel Logistic GmbH
      vehicleCount: 1,
      capacityPerVehicle: 300
    } /*,
    {
      warehouseAddress: 'Plischka und Schmeling,Fokkerstr. 8,Schkeuditz,04435', // Plischka und Schmeling
      vehicleCount: 1,
      capacityPerVehicle: 1800
    },
    {
      warehouseAddress: 'Honer Str. 49,Eschwege,37269', // Sunniva GmbH
      vehicleCount: 1,
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
  }
  {
    warehouseAddress: 'ILB Transit & Logistik GmbH & Co. KG,Bonifatiusstraße 391, Rheine, 48432',
    vehicleCount: 1,
    capacityPerVehicle: 1800
  }
   {
    warehouseAddress: 'AdL Logistic GmbH, Gerlinger Str. 34, Berlin, 12349',
    vehicleCount: 1,
    capacityPerVehicle: 1800
   },
   
 {
    warehouseAddress: 'Recht Logistik Gruppe, Weetfelder Str., Bönen, 59199',
    vehicleCount: 1,
    capacityPerVehicle: 1800
 }*/
];

//PLZ 75-71 YUNUS   MONTAG 23.06.2025



export const runTourController = async (req: Request, res: Response) => {
  const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId } = req.body;
  console.log(tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId);

  try {
    const placeholders = orderIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT order_id, street, city, zipcode FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );

    const orders = rows as any[];

    const jobList = orders.map(order => {
      const address = `${order.street}, ${order.city}, ${order.zipcode}`;
      return {
        id: `job_${order.order_id}`,
        address,
        demand: 26
      };
    });

    const fleetTypes = [];

    for (const group of warehouseGroups) {
      const location = await geocode(group.warehouseAddress);
      for (let i = 0; i < group.vehicleCount; i++) {
        fleetTypes.push({
          id: `${group.warehouseAddress.replace(/\W+/g, '_')}_vehicle_${i + 1}`,
          profile: 'truck',
          costs: { fixed: 50, distance: 0.02, time: 0.0015 },
          shifts: [
            {
              start: { time: '2025-06-23T07:30:00+04:00', location },
              end: { time: '2025-06-23T19:30:00+04:00', location }
            }
          ],
          capacity: [group.capacityPerVehicle],
          amount: 1
        });
      }
    }

    const jobs = await Promise.all(
      jobList.map(async (job) => {
        const location = await geocode(job.address);
        return {
          id: job.id,
          tasks: {
            deliveries: [
              {
                places: [{ location, duration: 300 }],
                demand: [job.demand]
              }
            ]
          }
        };
      })
    );

    const problem = {
      fleet: {
        types: fleetTypes,
        profiles: [{ type: 'truck', name: 'truck' }]
      },
      plan: { jobs }
    };

    const tourRes = await axios.post(
      `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
      problem,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const allDecodedRoutes = [];

    for (const tour of tourRes.data.tours || []) {
      const stops = tour.stops || [];
      if (stops.length < 2) continue;

      const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
      const destination = `${stops[stops.length - 1].location.lat},${stops[stops.length - 1].location.lng}`;
      const vias = stops
        .slice(1, -1)
        .map((stop: { location: { lat: number; lng: number } }) =>
          `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`
        )
        .join('');

      const url = `https://router.hereapi.com/v8/routes?transportMode=truck` +
        `&origin=${origin}&destination=${destination}${vias}` +
        `&return=polyline,summary` +
        `&truck.height=2.5&truck.length=6&truck.width=2.05&truck.weight=3.5&truck.axleCount=2&truck.trailerCount=1` +
        `&apiKey=${HERE_API_KEY}`;

      const resp = await axios.get(url);
      const sections = (resp.data.routes?.[0]?.sections || []).map((sec: any) => {
        const decoded = decode(sec.polyline).polyline;
        return {
          summary: sec.summary,
          coordinates: decoded.map(([lat, lng, z]) => ({ lat, lng, z: z || 0 })),
        };
      });

      allDecodedRoutes.push({
        vehicleId: tour.vehicleId,
        sections,
        stops
      });
    }

    res.json({ routes: allDecodedRoutes, unassigned: tourRes.data.unassigned });

  } catch (err) {
    console.error("Tour planning failed:", err);
    if (err instanceof Error) {
      res.status(500).json({ message: 'Tour planning or routing failed.', error: err.message });
    } else {
      res.status(500).json({ message: 'Tour planning or routing failed.', error: String(err) });
    }
  } finally {
    console.log("🔁 runTourController completed.");
    // Optional: you could log to a DB or analytics service here
  }
};
