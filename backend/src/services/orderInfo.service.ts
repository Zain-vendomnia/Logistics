import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL!;
const AUTH_CREDENTIALS = Buffer.from(
  `${process.env.API_USERNAME}:${process.env.API_PASSWORD}`
).toString("base64");

export const fetchOrders = async () => {
  try {
    // Prepare the params object. Since no parameters are required, we can leave it empty.
    const params: any = {};

    // Make the API request without any query parameters
    const response = await axios.get(API_URL, {
      params,
      headers: {
        Authorization: `Basic ${AUTH_CREDENTIALS}`,
      },
    });
    // console.log("Response from API:", response.data);
    // console.log(response.data.data[0]) // Log the response data
    return response.data;
  } catch (error) {
    console.error("Error fetching orders from API:", error);
    throw new Error("Failed to fetch order data");
  }
};
