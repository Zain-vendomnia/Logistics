import { Request, Response } from 'express';
import { createTour,deleteTours } from '../../model/tourModel';
import { OkPacket } from 'mysql2';  
import { tourInfo_master  } from '../../model/TourinfoMaster';
import { createRoutedata } from '../../services/createRoutedata';


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