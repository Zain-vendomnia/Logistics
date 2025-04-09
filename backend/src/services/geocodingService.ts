import axios from 'axios';
import { OrderDetails } from '../model/OrderDetails';
import connect from '../database';

interface GeocodingResponse {
  hits: Array<{
    point: {
      lat: number;
      lng: number;
    };
  }>;
}

export class GeocodingService {
  //private static GRAPH_HOPPER_API_KEY = process.env.GRAPH_HOPPER_API_KEY;
  private static GRAPH_HOPPER_API_KEY='10fd4ad9-4793-402d-acdc-a22bc9693b85'; 

  private static BASE_URL = 'https://graphhopper.com/api/1/geocode';

  
  static async getLatLngFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
     
      const response = await axios.get<GeocodingResponse>(this.BASE_URL, {
        params: {
          q: address,
          key: this.GRAPH_HOPPER_API_KEY,
        },
      });
        
      const firstHit = response.data.hits[0];

      if (firstHit) {
       
        return {
          lat: firstHit.point.lat,
          lng: firstHit.point.lng,
        };
      } else {
        console.error("No hits found for address:", address);
        throw new Error('No results found for the provided address');
      }
    } catch (error) {
      console.error('Error during geocoding:', error);
      return null;
    }
  }


   // Geocode all orders (addresses) from the database
   static async geocodeAllOrders(): Promise<{ id: string; type: string; address: { location_id: string; lat: number; lon: number } }[]> {
    const orders = await OrderDetails.getAllOrders();
    const results: { id: string; type: string; address: { location_id: string; lat: number; lon: number } }[] = [];

    // Iterate over the orders and geocode them
    for (let index = 0; index < orders.length; index++) {
      const order = orders[index];
      
      const latLng = await this.getLatLngFromAddress(order.address);

      if (latLng) {
        // Dynamically create the service id (e.g., s1, s2, etc.)
        const serviceId = `s${index + 1}`; // Dynamic ID starting from s1

        results.push({
          id: serviceId, // Dynamic ID
          type: "service", // Static type value
          address: {
            location_id: serviceId, // Same as ID
            lat: latLng.lat,
            lon: latLng.lng,
          }
        });
      }
    }

    return results;
  }
 
  static async geocodeAllcustomer(): Promise<{ id: string; type: string; address: { location_id: string; lat: number; lon: number } }[]> {
    const orders = await OrderDetails.getAllcustomerAddress();  // Get all orders
    const results: { id: string; type: string; address: { location_id: string; lat: number; lon: number } }[] = [];

    // Iterate over the orders and geocode them
    for (let index = 0; index < orders.length; index++) {
      const order = orders[index];
      const latLng = await this.getLatLngFromAddress(order.address);  // Get lat/lng from geocoding service

      if (latLng) {
        try {
          // Get a connection to the database
          const connection = await connect();
          // Execute the update query to set latitude and longitude in the database
          const [result] = await connection.execute(
            'UPDATE `orderdetails` SET `lattitude` = ?, `longitude` = ? WHERE `id` = ?',
            [latLng.lat, latLng.lng, order.id] 
          );
          // The result is an array, and the first item contains the `affectedRows` property
          const { affectedRows } = result as { affectedRows: number };  // Type assertion
          // Check if the row was successfully updated
          if (affectedRows > 0) {
            console.log(`Successfully updated order with ID: ${order.id}`);
       
          } else {
            console.warn(`No rows updated for order ID: ${order.id}`);
          }
        } catch (error) {
          console.error(`Error updating order ID: ${order.id}`, error);
        }
      }
    }

    return results;
  }
  
}
