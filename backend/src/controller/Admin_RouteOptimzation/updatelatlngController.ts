import { Request, Response } from 'express';
import { GeocodingService } from '../../services/geocodingService';

export const updatelatlngController = async (_req: Request, res: Response) => {
    try {
      const serviceData = await GeocodingService.geocodeAllcustomer();
       console.log(serviceData)  
      res.status(200).json({
        message: 'Customer data updated succesfully',
        data: serviceData
      });
    } catch (error) {
      console.error('Error during updating customer data:', error);
      res.status(500).json({
        message: 'Error update customer data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };