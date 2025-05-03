import { LogisticOrder } from "../model/LogisticOrders";
import { optimizeRoute } from "./routeOptimization.service";

export const createRoutedata = async (orderIds: number[]) => {
  try {
    
    const serviceData = await getlatlngAllorders(orderIds);
    console.log("serviceData", JSON.stringify(serviceData));
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
    return result.data;
   
  } catch (error) {
    console.error('Error during route optimization:', error);

  }

  // Transform the service data to match Graphhopper's expected format
  function transformServiceDataForGraphhopper(services: any[]) {
    return services.map(service => ({
      id: service.id,  
      lat: service.address.lat,  
      lon: service.address.lon   
    }));
  }
};

export async function getlatlngAllorders(orderIds: number[]): Promise<{ id: string; type: string; address: { location_id: string; lat: number; lon: number } }[]> {
  console.log("Received orderIds:", orderIds);

  // Fetch orders using the IDs (assumes you have this function)
  const orders = await LogisticOrder.getOrdersByIds(orderIds);

  const results: { id: string; type: string; address: { location_id: string; lat: number; lon: number } }[] = [];

   for (let index = 0; index < orders.length; index++) {
    const order = orders[index];
    const lattitude = order.lattitude ? parseFloat(order.lattitude.toString()) : 0;
    const longitude = order.longitude ? parseFloat(order.longitude.toString()) : 0;
    if (order.lattitude && order.longitude) {
      const serviceId = `s${index + 1}`;

      results.push({
        id: `${order.order_id}`,
        type: "service",
        address: {
          location_id: serviceId,
          lat: lattitude,
          lon: longitude,
        },
      });
    }
  } 

  return results;
}
  
