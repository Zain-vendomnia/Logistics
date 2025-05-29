import { Request, Response } from 'express';
import { createTour, deleteTours,updateTour,insertTourDriverData} from '../../model/tourModel';
import { OkPacket } from 'mysql2';
import { tourInfo_master } from '../../model/TourinfoMaster';
import { createRoutedata } from '../../services/createRoutedata';
import { route_segments } from '../../model/routeSegments';
import pool from '../../database';

export const createTourController = async (req: Request, res: Response) => {
  const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId } = req.body;
console.log(tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds, warehouseId);
  try {
    const result = await createTour({
      tourName,
      comments,
      startTime,
      endTime,
      driverid,
      routeColor,
      tourDate,
      orderIds,
      warehouseId,
    });

    const affectedRows = (result as OkPacket).affectedRows;
    const insertedTourId = (result as OkPacket).insertId;

    if (affectedRows > 0) {
      await UpdateRouteData(orderIds, insertedTourId, tourDate, driverid);
      res.status(200).json({ message: 'Tour saved successfully' });
    } else {
      res.status(500).json({ message: 'Failed to save the tour' });
    }
  } catch (error) {
    console.error('Error saving tour:', error);
    if (error instanceof Error) {
      if (error.message.includes('Driver already has a tour')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred while saving the tour.' });
    }
  }
};

  export const getTourcountcheck = async(_req: Request, res: Response) => {
    try {
      const orders = await tourInfo_master.getAllToursCount();
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  export const getgraphhopperRoute = async (_req: Request, res: Response)=>{
    const { tour_id } = _req.body;
    if (!tour_id) {
      return res.status(400).json({ message: 'Tour ID is required.' });
    }
    try{
      const routeRes = await tourInfo_master.getRouteResponse(parseInt(tour_id as string));
      res.status(200).json(routeRes);
    }catch(error){
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  export const getSegmentRoutes = async(_req: Request, res: Response)=>{
    const { tour_id } = _req.body;
    if (!tour_id) {
      return res.status(400).json({ message: 'Tour ID is required.' });
    }
    try{
      const routeRes = await route_segments.getRoutesegmentRes(parseInt(tour_id as string));
      res.status(200).json(routeRes);
    }catch(error){
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async function UpdateRouteData(_orderIds: number[], _insertedTourId: number, tourDate: string, driverId: number) {
    try {
      const serviceResponse = await createRoutedata(_orderIds);
      console.log('Service call successful:', serviceResponse);
  
      if (!serviceResponse) {
        throw new Error("GraphHopper response is empty or undefined.");
      }
  
      const responseJson = JSON.stringify(serviceResponse);
  
      // Save route data to tourInfo_master
      await tourInfo_master.updateGraphhopperResponse(_insertedTourId, responseJson);

      console.log('GraphHopper response saved to tourInfo_master.');
        // Save mapping to tour_driver table
        const datas={"tour_id": _insertedTourId, "driver_id": driverId, "tour_date": tourDate};
        await insertTourDriverData(datas);
        console.log('Tour-driver mapping inserted successfully.');

      const route = serviceResponse.solution.routes[0]; // assuming one route
      const segments = splitRouteSegments(route);

      for (const segment of segments) {
        const segmentJson = JSON.stringify(segment);
        const ordrid = segment.order_id;
        console.log(ordrid);
        if (ordrid === null) {
          throw new Error(`Segment has invalid order_id: ${JSON.stringify(segment)}`);
        }
       
        await route_segments.insertSegment(_insertedTourId, segmentJson, ordrid);
      }
  
      console.log(`Saved ${segments.length} segments to segmentTable.`);
  
    } catch (error) {
      console.error('Error updating GraphHopper response or inserting tour-driver data:', error);
    }
  }

  // Controller to delete multiple tours
export const deleteTourController = async (req: Request, res: Response) => {
  console.log('[deleteTourController] Request received to delete tours');
  
  try {
    const { tourIds } = req.body;
    console.log('[deleteTourController] Tour IDs to delete:', tourIds);

    if (!tourIds || !Array.isArray(tourIds)) {
      console.error('[deleteTourController] Invalid tour IDs provided');
      return res.status(400).json({ message: 'Tour IDs must be an array' });
    }

    if (tourIds.length === 0) {
      console.error('[deleteTourController] Empty tour IDs array provided');
      return res.status(400).json({ message: 'No tour IDs provided' });
    }

    const result = await deleteTours(tourIds);
    const affectedRows = (result as OkPacket).affectedRows;

    console.log('[deleteTourController] Delete result:', result);

    if (affectedRows > 0) {
      console.log(`[deleteTourController] Successfully deleted ${affectedRows} tours`);
      res.status(200).json({
        message: 'Tours deleted successfully',
        deletedCount: affectedRows,
      });
    } else {
      console.error('[deleteTourController] No tours found to delete');
      res.status(404).json({ message: 'No tours found to delete' });
    }
  } catch (error) {
    console.error('[deleteTourController] Error:', error);
    res.status(500).json({ 
      message: 'Error deleting tours',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function splitRouteSegments(route: { activities: any[]; points: any[] }) {
  const segments: {
    from: any;
    to: any;
    distance_to: number;
    driving_time_to: number;
    geometry: any;
    order_id: string; // changed to string
  }[] = [];

  const activities = route.activities;
  const points = route.points;

  for (let i = 0; i < activities.length - 1; i++) {
    const fromActivity = activities[i];
    const toActivity = activities[i + 1];

    const toLocationId = toActivity.location_id; // e.g., "orderid-1"

    const segment = {
      from: {
        location_id: fromActivity.location_id,
        lat: fromActivity.address.lat,
        lon: fromActivity.address.lon,
        arr_time: fromActivity.arr_time,
        arr_date_time: fromActivity.arr_date_time
      },
      to: {
        location_id: toActivity.location_id,
        lat: toActivity.address.lat,
        lon: toActivity.address.lon,
        arr_time: toActivity.arr_time,
        arr_date_time: toActivity.arr_date_time
      },
      distance_to: toActivity.distance,
      driving_time_to: toActivity.driving_time,
      geometry: points[i],
      order_id: toLocationId // just assign full string
    };

    segments.push(segment);
  }

  return segments;
}




export const updateTourController = async (req: Request, res: Response) => {
  const { id, tourName, comments, startTime, endTime, driverid, routeColor, tourDate } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Tour ID is required for update' });
  }

  if (!tourName || !comments || !startTime || !endTime || !driverid || !routeColor || !tourDate) {
    return res.status(400).json({ message: 'All fields are required for the update' });
  }

  try {
    const result = await updateTour({
      id,
      tourName,
      comments,
      startTime,
      endTime,
      driverid,
      routeColor,
      tourDate,
    });

    const affectedRows = (result as OkPacket).affectedRows;

    if (affectedRows > 0) {
      return res.status(200).json({ message: 'Tour updated successfully' });
    } else {
      return res.status(404).json({ message: 'Tour not found or no changes made' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error updating tour',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getTourstatus = async(_req: Request, res: Response) => {
  try {
    const tourCompletedIds = await tourInfo_master.getAllTourstatus();
    console.log("tourCompletedIds"+ JSON.stringify(tourCompletedIds));
    res.status(200).json(tourCompletedIds);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatetourstatus = async (_req: Request, res: Response) =>{
  const { tourId } = _req.params;
  console.log("tour_id" + tourId);
  try{
    await pool.query('UPDATE tourinfo_master SET tour_status = ? WHERE id = ?', ['confirmed', tourId])
    console.log(`Updating tour ${tourId} to 'confirmed'`);
    res.status(200).json({ message: 'Tour status updated to confirmed.' });
  }catch(error){
    console.error('Error updating tour status:',error);
    res.status(500).json({message:'Internal server error'});
  }
}