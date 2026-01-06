import { geocode } from "../services/hereMap.service";
import { Location } from "../types/hereMap.types";

export async function requestLocationCoordinates(address: string) {
  const location: Location = await geocode(address);
  return location;
}
