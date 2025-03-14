import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/driver/";

export const getTripData = async () => {
  //   const response = axios.get(API_URL + "getTripData", {
  //     headers: authHeader(),
  //   });

  return await Promise.resolve(tripData);
};

export const updateTripData = (data: any) => {
  const response = axios.post(API_URL + "updateTripData", data, {
    headers: authHeader(),
  });

  return response;
};

const tripData: TripData = {
  tripId: 1,
  tripStatus: "In Progress",
  tripDate: "2025-03-14",
  startPoint: "Warehouse A",
  endPoint: "Customer B",
  startCoordinates: "25.1816° N, 55.2715° E",
  destinationCoordinates: "25° 13' 13.69\" N, 55° 17' 7.87\" E",
  startTime: new Date().toISOString(),

  client: {
    name: "John Doe",
    address: "Park Lane 38, West Zone",
  },

  vehicle: "Truck",
  vehicleNumber: "001",
};

export default interface TripData {
  tripId: number;
  tripStatus: string;
  tripDate: string;
  startPoint: string;
  endPoint: string;
  startCoordinates: string;
  destinationCoordinates: string;
  startTime: string;
  client: ClientData;
  vehicle: string;
  vehicleNumber: string;
}

interface ClientData {
  name: string;
  address: string;
}
