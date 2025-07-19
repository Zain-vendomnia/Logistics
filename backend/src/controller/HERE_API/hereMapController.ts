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

const jobList = [
  {
    id: 'job_1',
    address: 'Stockholmer Str. 1, Böblingen, 71034',
    demand: 27,
  },
  {
    id: 'job_2',
    address: 'Feldbergstr. 63, Böblingen, 71032',
    demand: 27,
  },
  {
    id: 'job_3',
    address: 'Max-Planck-Str. 3, Ditzingen, 71254',
    demand: 27,
  },
  {
    id: 'job_4',
    address: 'Erwin-Rommel-Str. 8, Hemmingen, 71282',
    demand: 27,
  },
  {
    id: 'job_5',
    address: 'Vöhinger Weg 1, Schwieberdingen, 71701',
    demand: 27,
  },
  {
    id: 'job_6',
    address: 'Friedenstrasse 13,Ludwigsburg, 71636',
    demand: 27,
  },
  {
    id: 'job_7',
    address: 'Gartenstraße 50, Leutenbach,	71397',
    demand: 27,
  },
  {
    id: 'job_8',
    address: 'In der Stöck 46, Althütte, 71566',
    demand: 27,
  },
 
  {
    id: 'job_10',
    address: 'Waldblick 10,	Auenwald,	71549',
    demand: 27,
  },
  {
    id: 'job_11',
    address: 'Eichhäldenstraße 67, Oberstenfeld, 71720',
    demand: 27,
  },
  {
    id: 'job_12',
    address: 'Dreschhallenweg 5, Gemmingen, 75050',
    demand: 27,
  },
  {
    id: 'job_13',
    address: 'Alter Eppinger Weg 3, Gemmingen, 75050',
    demand: 27,
  },
  {
    id: 'job_14',
    address: 'Neuhöferstr. 12, Sulzfeld, 75056',
    demand: 27,
  },
  {
    id: 'job_15',
    address: 'Frontalstr. 2, Bretten, 75015',
    demand: 27,
  },
  {
    id: 'job_16',
    address: 'Am Söllinger 17, Bretten, 75015',
    demand: 27,
  },
  {
    id: 'job_17',
    address: 'Kernerstraße 13, Maulbronn, 75433',
    demand: 27,
  },
  {
    id: 'job_18',
    address: 'Brettener Strasse 4, Maulbronn, 75433',
    demand: 27,
  },
  {
    id: 'job_19',
    address: 'Plattenstr. 5, Wiernsheim, 75446',
    demand: 27,
  },
  {
    id: 'job_20',
    address: 'Waldstraße 3,	Pforzheim, 75181',
    demand: 27,
  },
  {
    id: 'job_21',
    address: 'Herschelstr 48,	Pforzheim 75175',
    demand: 27,
  },
  {
    id: 'job_22',
    address: 'Eichwaldstr. 49, Neuenbürg, 75305',
    demand: 27,
  },
   {
    id: 'job_23',
    address: 'Frankenweg 11, Calw, 75365',
    demand: 27,
  },
   {
    id: 'job_24',
    address: 'Sonnenbergstr. 36, Aidlingen, 71134',
    demand: 27,
  },
  {
    id: 'job_25',
    address: 'Hanfbergstraße 8,	Aidlingen,	71134',
    demand: 27,
  }
];

export const hereMapController = async (_req: Request, res: Response) => {
  try {
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

      // Build only the forward route
      const origin = `${stops[0].location.lat},${stops[0].location.lng}`;
      const destination = `${stops[stops.length - 1].location.lat},${stops[stops.length - 1].location.lng}`;
      const vias = stops
        .slice(1, -1)
        .map((stop: { location: { lat: any; lng: any; }; }) => `&via=${stop.location.lat},${stop.location.lng}!passThrough=true`)
        .join('');

      const url = `https://router.hereapi.com/v8/routes?transportMode=truck` +
        `&origin=${origin}&destination=${destination}${vias}` +
        `&return=polyline,summary` +
        `&truck.height=2.5` +
        `&truck.length=6` +
        `&truck.width=2.05` +
        `&truck.weight=3.5` +
        `&truck.axleCount=2` +
        `&truck.trailerCount=1` +
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
    console.error(err);
    if (err instanceof Error) {
      res.status(500).json({ message: 'Tour planning or routing failed.', error: err.message });
    } else {
      res.status(500).json({ message: 'Tour planning or routing failed.', error: String(err) });
    }
  }
};