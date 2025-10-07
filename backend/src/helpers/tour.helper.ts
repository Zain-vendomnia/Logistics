import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";

export async function generateTourName(orderIds: number[]): Promise<string> {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const zipcodePrefixes = Array.from(
    new Set(orders.map((o) => o.zipcode?.substring(0, 2) || "00"))
  );

  const zipcodeString = zipcodePrefixes.join("-");
  return `PLZ-${zipcodeString}`;
}

// Calculates the distance in kilometers between two lat/lng points
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
