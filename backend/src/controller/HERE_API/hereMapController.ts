import { Request, Response } from "express";
import hereMapService from "../../services/hereMapService";
import { DecodedRoute } from "../../types/hereMap.types";

const warehouseGroups = [
  {
    warehouseAddress:
      "WeltZiel Logistic GmbH., Rudolf-Diesel-Straße 40 , Nufringen, 71154 ", // WeltZiel Logistic GmbH
    vehicleCount: 1,
    capacityPerVehicle: 300,
  },
  {
    warehouseAddress: "Plischka und Schmeling,Fokkerstr. 8,Schkeuditz,04435", // Plischka und Schmeling
    vehicleCount: 1,
    capacityPerVehicle: 1800,
  },
  {
    warehouseAddress: "Honer Str. 49,Eschwege,37269", // Sunniva GmbH
    vehicleCount: 1,
    capacityPerVehicle: 1800,
  },
  {
    warehouseAddress:
      "Geis Eurocargo GmbH, Ipsheimer Straße 19, Nürnberg , 90431",
    vehicleCount: 1,
    capacityPerVehicle: 1800,
  },
];

//PLZ 75-71 YUNUS   MONTAG 23.06.2025

const jobList = [
  {
    id: "job_1",
    address: "Stockholmer Str. 1, Böblingen, 71034",
    demand: 27,
  },
  {
    id: "job_2",
    address: "Feldbergstr. 63, Böblingen, 71032",
    demand: 27,
  },
  {
    id: "job_3",
    address: "Max-Planck-Str. 3, Ditzingen, 71254",
    demand: 27,
  },
  {
    id: "job_4",
    address: "Erwin-Rommel-Str. 8, Hemmingen, 71282",
    demand: 27,
  },
  {
    id: "job_5",
    address: "Vöhinger Weg 1, Schwieberdingen, 71701",
    demand: 27,
  },
  {
    id: "job_6",
    address: "Friedenstrasse 13,Ludwigsburg, 71636",
    demand: 27,
  },
  {
    id: "job_7",
    address: "Gartenstraße 50, Leutenbach,	71397",
    demand: 27,
  },
  {
    id: "job_8",
    address: "In der Stöck 46, Althütte, 71566",
    demand: 27,
  },

  {
    id: "job_10",
    address: "Waldblick 10,	Auenwald,	71549",
    demand: 27,
  },
  {
    id: "job_11",
    address: "Eichhäldenstraße 67, Oberstenfeld, 71720",
    demand: 27,
  },
  {
    id: "job_12",
    address: "Dreschhallenweg 5, Gemmingen, 75050",
    demand: 27,
  },
  {
    id: "job_13",
    address: "Alter Eppinger Weg 3, Gemmingen, 75050",
    demand: 27,
  },
  {
    id: "job_14",
    address: "Neuhöferstr. 12, Sulzfeld, 75056",
    demand: 27,
  },
  {
    id: "job_15",
    address: "Frontalstr. 2, Bretten, 75015",
    demand: 27,
  },
  {
    id: "job_16",
    address: "Am Söllinger 17, Bretten, 75015",
    demand: 27,
  },
  {
    id: "job_17",
    address: "Kernerstraße 13, Maulbronn, 75433",
    demand: 27,
  },
  {
    id: "job_18",
    address: "Brettener Strasse 4, Maulbronn, 75433",
    demand: 27,
  },
  {
    id: "job_19",
    address: "Plattenstr. 5, Wiernsheim, 75446",
    demand: 27,
  },
  {
    id: "job_20",
    address: "Waldstraße 3,	Pforzheim, 75181",
    demand: 27,
  },
  {
    id: "job_21",
    address: "Herschelstr 48,	Pforzheim 75175",
    demand: 27,
  },
  {
    id: "job_22",
    address: "Eichwaldstr. 49, Neuenbürg, 75305",
    demand: 27,
  },
  {
    id: "job_23",
    address: "Frankenweg 11, Calw, 75365",
    demand: 27,
  },
  {
    id: "job_24",
    address: "Sonnenbergstr. 36, Aidlingen, 71134",
    demand: 27,
  },
  {
    id: "job_25",
    address: "Hanfbergstraße 8,	Aidlingen,	71134",
    demand: 27,
  },
];

export const hereMapController = async (_req: Request, res: Response) => {
  try {
    const { tours, unassigned } = await hereMapService.PlanTourAsync_Mock(
      jobList,
      warehouseGroups
    );

    console.log("Newly created Tours: ", { tours });

    const allDecodedRoutes: DecodedRoute[] = [];

    for (const tour of tours || []) {
      const routes = await hereMapService.getRoutesForTour(tour);

      // await createDynamicTour({
      //   tour_route: routes!,
      //   orderIds: routes?.stops
      //     .slice(1)
      //     .map((stop) =>
      //       stop.activities.map((activity: any) => activity.jobId.split("_")[1])
      //     )
      //     .join(",")!,
      //   warehouse_id: count + 1,
      // });

      allDecodedRoutes.push(routes!);
    }

    // console.log("All Tour - Route Data: ", {
    //   routes: allDecodedRoutes,
    //   unassigned,
    // });

    res.json({ routes: allDecodedRoutes, unassigned });
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      res.status(500).json({
        message: "Tour planning or routing failed.",
        error: err.message,
      });
    } else {
      res.status(500).json({
        message: "Tour planning or routing failed.",
        error: String(err),
      });
    }
  }
};
