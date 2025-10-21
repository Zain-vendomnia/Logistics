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