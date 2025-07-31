import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";
import { route_segments } from "../model/routeSegments";
import { tourInfo_master } from "../model/TourinfoMaster";
import {
  insertTourDriverData,
  removeUnassignedOrders,
} from "../model/tourModel";
import { CreateTour } from "../types/dto.types";
import { Tour, LogisticsRoute } from "../types/tour.types";
import hereMapService from "./hereMapService";

export async function getTourMapDataAsync(
  tour_payload: CreateTour,
  tourId: number
) {
  const orders = (await get_LogisticsOrdersAddress(
    tour_payload.orderIds
  )) as LogisticOrder[];

  const { tour, unassigned } = await hereMapService.createTourAsync(orders);

  const hereMapResJson = JSON.stringify({ tour, unassigned });
  await tourInfo_master.updateHereMapResponse(tourId, hereMapResJson);

  let lg_routes: LogisticsRoute[] = [];
  // handling Route Segments
  try {
    const routes = await getRouteSegments_mapApi(tour);
    lg_routes = routes;
    // setRouteSegments
    for (const segment of routes) {
      const segmentJson = JSON.stringify(segment);
      const ordrid = segment.order_id;
      console.log(ordrid);

      if (!ordrid)
        throw new Error(
          `Segment has invalid order_id: ${JSON.stringify(segment)}`
        );

      await route_segments.insertSegment(tourId, segmentJson, ordrid);
    }
    console.log(`Saved ${routes.length} segments to segmentTable.`);
  } catch (error) {
    console.error(
      "Error updating Map response or inserting tour-driver data:",
      error
    );
  }

  // Polulate tour-driver table
  const data = {
    tour_id: tourId,
    driver_id: tour_payload.driverId,
    tour_date: tour_payload.tourDate,
  };
  await insertTourDriverData(data);
  console.log("Tour-driver mapping inserted successfully.");

  // Handle ussigned orders
  const unassignedOrderIds: number[] = unassigned
    .map((e) => Number(e.jobId.split("_")[1]))
    .filter((id) => !isNaN(id));
  console.log(
    `Unassigned Orders: Removing ${unassignedOrderIds.length} unassigned order(s)`
  );
  await removeUnassignedOrders(tourId, unassignedOrderIds);

  const unassignedOrders = await LogisticOrder.getOrdersByIds(
    unassignedOrderIds
  );

  const tourName = await tourInfo_master.getTourNameByIdAsync(tourId);
  return {
    tour: tourName,
    routes: lg_routes,
    unassigned: unassignedOrders.map((o) => o.order_number).join(","),
  };
}

async function getRouteSegments_mapApi(tour: Tour): Promise<LogisticsRoute[]> {
  const segments: LogisticsRoute[] = [];

  const stops = tour.stops;

  for (let i = 0; i < stops.length; i++) {
    const origin = stops[i];
    const destination = stops[i + 1];
    if (!destination) break;

    const subTour: Tour = {
      ...tour,
      stops: [origin, destination],
    };
    const routes = await hereMapService.getRoutesForTour(subTour);

    if (!routes) throw new Error("Failsed to decode routes");

    console.log(
      `Route Segment created for Order Id ${destination.activities[0].jobId}`
    );

    const segment: LogisticsRoute = {
      from: {
        location_id: origin.activities[0].jobId,
        lat: origin.location.lat,
        lon: origin.location.lng,
        arr_time: origin.time.arrival,
        arr_date_time: origin.time.arrival,
      },
      to: {
        location_id: destination.activities[0].jobId,
        lat: destination.location.lat,
        lon: destination.location.lng,
        arr_time: destination.time.arrival,
        arr_date_time: destination.time.arrival,
      },
      distance_to: destination.distance,
      driving_time_to: destination.distance,
      geometry: routes,
      order_id: destination.activities[0].jobId,
    };

    segments.push(segment);
  }
  console.log("segments.length: ", segments.length);
  return segments;
}

export async function getTourDetailsById(tourId: number) {
  const tourObj = await tourInfo_master.getTourNameByIdAsync(tourId);
  const routes = await route_segments.getAllRouteSegments_TourId(tourId);

  return { tour: tourObj.tour_name, routes, unassigned: "400098044,400098044" };
}
// async function UpdateRouteData(
//   _orderIds: number[],
//   _insertedTourId: number,
//   tourDate: string,
//   driverId: number
// ) {
//   try {
//     const serviceResponse = await createRoutedata(_orderIds);
//     console.log("Service call successful:", serviceResponse);

//     if (!serviceResponse) {
//       throw new Error("GraphHopper response is empty or undefined.");
//     }

//     const responseJson = JSON.stringify(serviceResponse);

//     // Save route data to tourInfo_master
//     await tourInfo_master.updateGraphhopperResponse(
//       _insertedTourId,
//       responseJson
//     );

//     console.log("GraphHopper response saved to tourInfo_master.");
//     // Save mapping to tour_driver table
//     const datas = {
//       tour_id: _insertedTourId,
//       driver_id: driverId,
//       tour_date: tourDate,
//     };
//     await insertTourDriverData(datas);
//     console.log("Tour-driver mapping inserted successfully.");

//     const route = serviceResponse.solution.routes[0]; // assuming one route
//     const segments = splitRouteSegments(route);

//     for (const segment of segments) {
//       const segmentJson = JSON.stringify(segment);
//       const ordrid = segment.order_id;
//       console.log(ordrid);
//       if (ordrid === null) {
//         throw new Error(
//           `Segment has invalid order_id: ${JSON.stringify(segment)}`
//         );
//       }

//       await route_segments.insertSegment(_insertedTourId, segmentJson, ordrid);
//     }

//     console.log(`Saved ${segments.length} segments to segmentTable.`);
//   } catch (error) {
//     console.error(
//       "Error updating GraphHopper response or inserting tour-driver data:",
//       error
//     );
//   }
// }

// Controller to delete multiple tours

// function splitRouteSegments(route: { activities: any[]; points: any[] }) {
//   const segments: {
//     from: any;
//     to: any;
//     distance_to: number;
//     driving_time_to: number;
//     geometry: any;
//     order_id: string; // changed to string
//   }[] = [];

//   const activities = route.activities;
//   const points = route.points;

//   for (let i = 0; i < activities.length - 1; i++) {
//     const fromActivity = activities[i];
//     const toActivity = activities[i + 1];

//     const toLocationId = toActivity.location_id; // e.g., "orderid-1"

//     const segment = {
//       from: {
//         location_id: fromActivity.location_id,
//         lat: fromActivity.address.lat,
//         lon: fromActivity.address.lon,
//         arr_time: fromActivity.arr_time,
//         arr_date_time: fromActivity.arr_date_time,
//       },
//       to: {
//         location_id: toActivity.location_id,
//         lat: toActivity.address.lat,
//         lon: toActivity.address.lon,
//         arr_time: toActivity.arr_time,
//         arr_date_time: toActivity.arr_date_time,
//       },
//       distance_to: toActivity.distance,
//       driving_time_to: toActivity.driving_time,
//       geometry: points[i],
//       order_id: toLocationId, // just assign full string
//     };

//     segments.push(segment);
//   }

//   return segments;
// }

// Controller function
