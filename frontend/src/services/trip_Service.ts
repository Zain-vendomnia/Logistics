import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/driver/";

export const uploadImage_01 = async (data: FormData) => {
  const response = await axios.post("/api/upload", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export const uploadImage = (data: FormData) => {
  return axios
    .post("https://jsonplaceholder.typicode.com/posts", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("API Upload Image error: ", error.message);
      return null;
    });
};

export const getTripData = async () => {
  //   const response = axios.get(API_URL + "getTripData", {
  //     headers: authHeader(),
  //   });

  return await Promise.resolve(fakeTripData);
};

export const updateTripData = (data: any) => {
  const response = axios.post(API_URL + "updateTripData", data, {
    headers: authHeader(),
  });

  return response;
};

const fakeTripData: TripData = {
  // orderId: "SV-2025002346",
  orderId: generateRandomString(),
  shippingStatus: "In Progress",
  tripDate: "2025-03-14",
  startPoint: "Warehouse A",
  endPoint: "Customer B",
  startCoordinates: null,
  // destinationCoordinates: "25° 13' 13.69\" N, 55° 17' 7.87\" E",
  destinationCoordinates: [25.1972, 55.2744],
  startTime: new Date().toISOString(),

  client: {
    name: "John Doe",
    address: "Park Lane 38, West Zone",
  },

  vehicle: "Truck",
  vehicleNumber: "001",
};

export interface TripData {
  orderId: string;
  shippingStatus: string;
  tripDate: string;
  startPoint: string;
  endPoint: string;
  startCoordinates: [number, number] | null;
  destinationCoordinates: [number, number] | null;
  startTime: string;
  client: ClientData;
  vehicle: string;
  vehicleNumber: string;
}

interface ClientData {
  name: string;
  address: string;
}

function generateRandomString(length: number = 6): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SL-${result}`;
}
