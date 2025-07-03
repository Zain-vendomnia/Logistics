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

export const runTourController = async (req: Request, res: Response) => {
  const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId } = req.body;
  console.log(tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId);

  try {
    const placeholders = orderIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT order_id, street, city, zipcode FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );
    console.log('Orders:', rows);
    const orders = rows as any[];

    const jobList = orders.map(order => {
      const address = `${order.street}, ${order.city}, ${order.zipcode}`;
      return {
        id: `job_${order.order_id}`,  // ✅ now order_id will exist
        address,
        demand: 1
        //timeWindow: ['2025-07-11T10:00:00Z', '2025-07-11T12:00:00Z']
      };
    });

    console.log("jobList" + JSON.stringify(jobList));

    const vehicle = {
      id: 'vehicle_1',
      startAddress: 'Berlin Central Station',
      endAddress: 'Berlin Central Station',
      capacity: 50
    };
    
    /*    const jobList = [
          {
            id: 'job_1',
            address: 'Bachstraße 12, Berlin, 10115',
            demand: 10,
            timeWindow: ['2025-06-11T10:00:00Z', '2025-06-11T12:00:00Z']
          },
          {
            id: 'job_2',
            address: 'Kaiserstraße 8, Düsseldorf, 40210',
            demand: 20,
            timeWindow: ['2025-06-11T13:00:00Z', '2025-06-11T15:00:00Z']
          }
        ];  */
    const start = await geocode(vehicle.startAddress);
    const end = await geocode(vehicle.endAddress);

    const jobs = await Promise.all(
      jobList.map(async (job) => {
        const location = await geocode(job.address);
        return {
          id: job.id,
          tasks: {
            deliveries: [
              {
                places: [
                  {
                    location,
                    // times: [job.timeWindow],
                    duration: 600
                  }
                ],
                demand: [job.demand]
              }
            ]
          }
        };
      })
    );
    
    const problem = {
      fleet: {
        types: [
          {
            id: vehicle.id,
            profile: 'car',
            costs: { fixed: 5, distance: 0.01, time: 0.002 },
            shifts: [
              {
                "start": { time: "2025-07-11T06:00:00Z", location: start },
                "end": { time: "2025-07-11T20:00:00Z", location: end },

              }
            ],
            capacity: [vehicle.capacity],
            amount: 1
          }
        ],
        profiles: [{ type: 'car', name: 'car' }]
      },
      plan: { jobs }
    };

    console.log(JSON.stringify(problem, null, 2));

    const tourRes = await axios.post(
      `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
      problem,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const stops = tourRes.data.tours[0]?.stops || [];
    if (tourRes.data.unassigned?.length > 0) {
      console.warn("Some jobs could not be assigned:");
      console.table(tourRes.data.unassigned.map((u: { id: any; reasons: any[]; }) => ({
        jobId: u.id,
        reasons: u.reasons?.join(', ')
      })));
    }
    console.log('Tours:', JSON.stringify(tourRes.data.tours, null, 2));
    console.log('Unassigned Jobs:', JSON.stringify(tourRes.data.unassigned, null, 2));
    if (stops.length < 2) throw new Error('Not enough stops to route');
    const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
    const destination = `${stops[stops.length - 1].location.lat},${stops[stops.length - 1].location.lng}`;
    const vias = stops.slice(1, -1)
      .map((stop: { location: { lat: number; lng: number } }) =>
        `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`
      )
      .join('');
    const routingUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin}&destination=${destination}${vias}&return=polyline&apiKey=${HERE_API_KEY}`;
    const routingRes = await axios.get(routingUrl);
    if (!routingRes.data.routes || routingRes.data.routes.length === 0) {
      throw new Error('Routing failed or returned no routes.');
    }

    const sections = routingRes.data.routes[0].sections;
    //console.log("Response- " + JSON.stringify(routingRes.data));

    const decodedSections = sections.map((section: any) => {
      const decoded = decode(section.polyline).polyline;
      return {
        summary: section.summary,
        coordinates: decoded.map(([lat, lng, z]) => ({
          lat,
          lng,
          z: z || 0,
        })),
      };
    });
    res.json({ sections: decodedSections, stops });
    //res.json({ stops, routePolyline: decoded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Tour planning or routing failed.' });
  }
};
