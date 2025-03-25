import axios from "axios";

const GRAPH_HOPPER_API_KEY = "10fd4ad9-4793-402d-acdc-a22bc9693b85";

export const getRoute = async (
  start: [number, number],
  end: [number, number]
) => {
  const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&key=${GRAPH_HOPPER_API_KEY}&points_encoded=false`;

  const response = await axios.get(url);
  console.log("route respone: ", response.data.paths[0]);
  console.log("route respone: ", response.data);
  return response.data.paths[0];
};
