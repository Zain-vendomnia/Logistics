import { Request, Response } from "express";
import axios from "axios";
import { decode } from "../../utils/flexiblePolylineDecoder";

const HERE_API_KEY = process.env.HERE_API_KEY || '2tJpOzfdl3mgNpwKiDt-KuAQlzgEbsFkbX8byW97t1k';

const geocode = async (address: string) => {
  const res = await axios.get(
    `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${HERE_API_KEY}`
  );
  const loc = res.data.items[0]?.position;
  if (!loc) throw new Error(`Could not geocode address: ${address}`);
  return loc;
};

export const dynamicTourController = async (_req: Request, res: Response) => {
  //const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId } = req.body;
  //console.log(tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId);

  try {
   /* const placeholders = orderIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT order_id, street, city, zipcode FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );
    console.log('Orders:', rows);
    const orders = rows as any[]; */
   /* const jobList = orders.map(order => {
      const address = `${order.street}, ${order.city}, ${order.zipcode}`;
      return {
        id: `job_${order.order_id}`,  // ✅ now order_id will exist
        address,
        demand: 10
        //timeWindow: ['2025-07-11T10:00:00Z', '2025-07-11T12:00:00Z']
      };
    }); */
   // console.log("jobList" + JSON.stringify(jobList));

    const vehicle = {
      id: 'vehicle_1',
      startAddress: 'Honer Str. 49, 37269 Eschwege, Germany',
      endAddress: 'Honer Str. 49, 37269 Eschwege, Germany',
      capacity:15
    };
    
     const jobList = [
          {
            id: 'job_1',
            address: 'Reichensachsen,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_2',
            address: 'Eisenacher Str. 25,37269 Eschwege',
            demand: 1,
          },
            {
            id: 'job_3',
            address: 'Grebendorf,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_4',
            address: 'Leuchtbergstraße 16,37269 Eschwege',
            demand: 1,
          },
          {
            id: 'job_5',
            address: 'Langemarckstraße 41,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_6',
            address: 'Grebendorf,37276 Meinhard,',
            demand: 1,
          }, 
           {
            id: 'job_7',
            address: 'Schwebda,37276 Meinhard',
            demand: 1,
           
          },
          {
            id: 'job_8',
            address: 'Am Werrauferpark,37269 Eschwege',
            demand: 1,
          },
          {
            id: 'job_9',
            address: 'Grebendorf,37276 Meinhard',
            demand: 1,
           
          },
          {
            id: 'job_10',
            address: 'Am Schindeleich 35-33,37269 Eschwege',
            demand: 1,
          }, 
           {
            id: 'job_11',
            address: 'Am Ottilienberg 21,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_12',
            address: 'Sandweg 15-1,37269 Eschwege',
            demand: 1,
          },
          {
            id: 'job_13',
            address: 'Döhlestraße 14-18,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_14',
            address: 'Am Schindeleich 47-37,37269 Eschwege',
            demand: 1,
          }, 
           {
            id: 'job_15',
            address: 'L3244 50,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_16',
            address: 'Finkenweg 12,37269 Eschwege, Germany',
            demand: 1,
          },
          {
            id: 'job_17',
            address: 'Breite Str. 2,37269 Eschwege',
            demand: 1,
           
          },
          {
            id: 'job_18',
            address: 'Unter dem Bückeberg,37269 Eschwege,',
            demand: 1,
          }, 
           {
            id: 'job_19',
            address: 'Freizeitzentrum 1,37276 Meinhard,',
            demand: 1,
           
          },
          {
            id: 'job_20',
            address: 'Abterode,37290 Meißner,',
            demand: 1,
          },
          {
            id: 'job_21',
            address: 'Frankershausen,37290 Meißner',
            demand: 1,
           
          },
          {
            id: 'job_22',
            address: 'Berkatal,37297,',
            demand: 1,
          }, 
           {
            id: 'job_23',
            address: 'RKleinvach,37242 Bad Sooden-Allendorf,',
            demand: 1,
           
          },
          {
            id: 'job_24',
            address: 'Meißner,37290, Germany',
            demand: 1,
          },
          {
            id: 'job_25',
            address: 'Waldkappel,37284',
            demand: 1,
           
          },
          {
            id: 'job_26',
            address: 'Langenhain,37287 Wehretal',
            demand: 1,
          }, 
           {
            id: 'job_27',
            address: 'Rastplatz,37269 Eschwege, Germany',
            demand: 1,
           
          },
          {
            id: 'job_28',
            address: 'Hauptstraße,37287 Wehretal',
            demand: 1,
          }
        ];  

    const start = await geocode(vehicle.startAddress);
    //const end = await geocode(vehicle.endAddress);

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
                    duration: 300
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
                "start": { time: "2025-06-20T08:00:00+04:00", location: start }
                //"end": { time: "2025-07-11T20:00:00Z", location: end },

              }
            ],
            capacity: [vehicle.capacity],
            amount: 2
          }
        ],
        profiles: [{ type: 'car', name: 'car' }]
      },
      plan: { jobs }
    };

    //console.log(JSON.stringify(problem, null, 2));

    const tourRes = await axios.post(
      `https://tourplanning.hereapi.com/v3/problems?apiKey=${HERE_API_KEY}`,
      problem,
      { headers: { 'Content-Type': 'application/json' } }
    );
 

    const allDecodedRoutes = [];

for (const tour of tourRes.data.tours) {
  const stops = tour.stops || [];
  if (stops.length < 2) continue;

  const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
  const destination = `${stops[stops.length - 1].location.lat},${stops[stops.length - 1].location.lng}`;
  const vias = stops.slice(1, -1)
    .map((stop: { location: { lat: any; lng: any; }; }) => `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`)
    .join('');

  const routingUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin}&destination=${destination}${vias}&return=polyline,summary&apiKey=${HERE_API_KEY}`;

  const routingRes = await axios.get(routingUrl);
  const sections = routingRes.data.routes?.[0]?.sections || [];

  const decodedSections = sections.map((section: { polyline: string; summary: any; }) => {
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

  allDecodedRoutes.push({
    vehicleId: tour.vehicleId,
    sections: decodedSections,
    stops,
  });
}

res.json({ routes: allDecodedRoutes, unassigned: tourRes.data.unassigned });

   // res.json( tourRes.data );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Tour planning or routing failed.' });
  }
};
