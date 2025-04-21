import { Request, Response } from 'express';
import { createTour } from '../../model/tourModel';
import { OkPacket } from 'mysql2';  
import { tourInfo_master } from '../../model/TourinfoMaster';

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
  
      if (affectedRows > 0) {

       // UpdateRouteData(orderIds);
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

/*   const UpdateRouteData = async (orderIds: number[]) => {
    try {
        // Assuming you call a service here with the orderIds
       // const serviceResponse = await createRoutedata(orderIds);  // Replace with your actual service call
       // console.log('Service call successful:', serviceResponse);
    } catch (error) {
        console.error('Error calling the next service:', error);
    }
}; */