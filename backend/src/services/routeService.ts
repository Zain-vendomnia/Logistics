import axios from "axios";

const API_KEY = "xrouten_SNsfJWNuj4fUQNitG22Jaw_01JKY2GGT0K3D23DYCZKZ94BVH"; 

// Function to get route estimate from the external API
export const getRouteEstimate = async (origin: string, destination: string) => {
  try {
    const response = await axios.post(
      "https://app.xrouten.de/api/estimate",
      { origin, destination },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error making API request:", error);
    throw new Error("Unable to fetch route estimate");
  }
};
