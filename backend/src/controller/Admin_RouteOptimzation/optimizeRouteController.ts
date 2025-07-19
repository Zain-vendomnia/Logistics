import { Request, Response } from 'express';
import { GeocodingService } from '../../services/geocodingService';
import { optimizeRoute } from '../../services/routeOptimization.service';

export const optimizeRouteController = async (_req: Request, res: Response) => {
  try {
    //  service data from your GeocodingService
    const serviceData = await GeocodingService.geocodeAllOrders(); // Or your pre-existing service data
    console.log("serviceData" + JSON.stringify(serviceData));

    // Transform service data to match Graphhopper's expected format
    const transformedServiceData = transformServiceDataForGraphhopper(serviceData);

    // Static vehicle data (adjust as needed)
    const vehicleData = [
      {
        vehicle_id: 'v1',
        lat: 48.142667,
        lon: 11.548715
      }
     
    ];

    // Call Graphhopper's optimizeRoute with the transformed serviceData and vehicleData as separate arguments
    const result = await optimizeRoute(transformedServiceData, vehicleData);

    // Return the response from Graphhopper
    res.json(result.data);
  } catch (error) {
    console.error('Error during route optimization:', error);
    res.status(500).json({
      message: 'Error optimizing route',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Transform the service data to match Graphhopper's expected format
  function transformServiceDataForGraphhopper(services: any[]) {
    return services.map(service => ({
      id: service.id,  // The service ID
      lat: service.address.lat,  // Lat from geocoding
      lon: service.address.lon   // Lon from geocoding
    }));
  }
};
