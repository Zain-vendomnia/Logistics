// Define the expected structure of the response
export interface RouteDataResponse {
    solution: {
      routes: {
        points: {
          coordinates: [number, number][]; // Array of coordinates, where each coordinate is [lon, lat]
        }[];
      }[];
    };
  }
  