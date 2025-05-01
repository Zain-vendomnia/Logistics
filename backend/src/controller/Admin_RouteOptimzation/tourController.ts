import { Request, Response } from 'express';
import { createTour, deleteTours,updateTour } from '../../model/tourModel';
import { OkPacket } from 'mysql2';
import { tourInfo_master } from '../../model/TourinfoMaster';
import { createRoutedata } from '../../services/createRoutedata';
import { route_segments } from '../../model/routeSegments';


// Controller to create a new tour
export const createTourController = async (req: Request, res: Response) => {
    const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds} = req.body;
  
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
      });
  
      // If result is of type OkPacket (from mysql2), it will contain affectedRows
      const affectedRows = (result as OkPacket).affectedRows;
      const insertedTourId = (result as OkPacket).insertId;
      if (affectedRows > 0) {
        await UpdateRouteData(orderIds, insertedTourId); 
        res.status(200).json({ message: 'Tour saved successfully' });
      } else {
        res.status(500).json({ message: 'Failed to save the tour' });
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      res.status(500).json({ message: 'Error saving tour' });
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


  async function UpdateRouteData(_orderIds: number[],_insertedTourId: number) {
    try {
      const serviceResponse = await createRoutedata(_orderIds);
      console.log('Service call successful:', serviceResponse);
      if (!serviceResponse) {
        throw new Error("GraphHopper response is empty or undefined.");
      }
      const responseJson = JSON.stringify(serviceResponse);
      // Save to DB
      await tourInfo_master.updateGraphhopperResponse(_insertedTourId, responseJson);

      console.log('GraphHopper response saved to tourInfo_master.');

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
      console.error('ErError updating GraphHopper response:', error);
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
  console.log('[updateTourController] Request received to update tour');

  // Destructuring request body
  const { id, tourName, comments, startTime, endTime, driverid, routeColor, tourDate } = req.body;

  console.log('[updateTourController] Request body:', {
    id,
    tourName,
    comments,
    startTime,
    endTime,
    driverid,
    routeColor,
    tourDate,
  });

  // Basic validation to ensure that `id` is provided
  if (!id) {
    return res.status(400).json({ message: 'Tour ID is required for update' });
  }

  // Validate other fields (ensure they are not empty or undefined)
  if (!tourName || !comments || !startTime || !endTime || !driverid || !routeColor || !tourDate) {
    return res.status(400).json({ message: 'All fields are required for the update' });
  }

  try {
    // Call the updateTour function to update the tour in the database
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

    // Get the number of affected rows to determine if the update was successful
    const affectedRows = (result as OkPacket).affectedRows;

    console.log('[updateTourController] Database result:', result);

    if (affectedRows > 0) {
      console.log('[updateTourController] Tour updated successfully');
      res.status(200).json({ message: 'Tour updated successfully' });
    } else {
      // If no rows were affected, it might mean that the tour ID doesn't exist or no changes were made
      console.error('[updateTourController] No rows affected during update');
      res.status(404).json({ message: 'Tour not found or no changes made' });
    }
  } catch (error) {
    // Handle any errors during the update process
    console.error('[updateTourController] Error:', error);
    res.status(500).json({
      message: 'Error updating tour',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};