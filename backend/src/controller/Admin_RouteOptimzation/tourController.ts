import { Request, Response } from 'express';
import { createTour, deleteTours,updateTour } from '../../model/tourModel';
import { OkPacket } from 'mysql2';
import { tourInfo_master } from '../../model/TourinfoMaster';

// Controller to create a new tour
export const createTourController = async (req: Request, res: Response) => {
  console.log('[createTourController] Request received to create tour');
  
  const { tourName, comments, startTime, endTime, driverid, routeColor, tourDate, orderIds } = req.body;

  console.log('[createTourController] Request body:', {
    tourName,
    comments,
    startTime,
    endTime,
    driverid,
    routeColor,
    tourDate,
    orderIds
  });

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

    const affectedRows = (result as OkPacket).affectedRows;

    console.log('[createTourController] Database result:', result);

    if (affectedRows > 0) {
      console.log('[createTourController] Tour created successfully');
      res.status(200).json({ message: 'Tour saved successfully' });
    } else {
      console.error('[createTourController] No rows affected when creating tour');
      res.status(500).json({ message: 'Failed to save the tour' });
    }
  } catch (error) {
    console.error('[createTourController] Error:', error);
    res.status(500).json({ 
      message: 'Error saving tour',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Controller to get total count of tours
export const getTourcountcheck = async (_req: Request, res: Response) => {
  console.log('[getTourcountcheck] Request received for tour count');
  
  try {
    const orders = await tourInfo_master.getAllToursCount();
    console.log('[getTourcountcheck] Total tours count:', orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error('[getTourcountcheck] Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

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