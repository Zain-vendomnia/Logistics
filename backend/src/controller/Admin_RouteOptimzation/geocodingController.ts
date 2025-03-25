import { Request, Response } from 'express';
import { GeocodingService } from '../../services/geocodingService';

export class GeocodingController {
    static async getLatLng(_req: Request, res: Response): Promise<void> {
      try {
        const result = await GeocodingService.geocodeAllOrders();
        if (result.length > 0) {
          res.status(200).json(result); // Return the list of geocoded addresses with lat/lng
        } else {
          res.status(404).json({ error: 'No orders found or geocoding failed' });
        }
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Something went wrong' });
      }
    }
}
