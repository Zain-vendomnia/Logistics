import { Order } from "../../types/order.types";

export function clusterWeight(orders: Order[]) {
  return orders.reduce((s, o) => s + (o.weight_kg ?? 0), 0);
}

export function grossWeight(orders: Order[] | Order[][]): number {
  if (Array.isArray(orders[0])) {
    const ordersList = orders as Order[][];
    return ordersList.reduce((totalSum, group) => {
      const groupSum = group.reduce((acc, o) => acc + (o.weight_kg || 0), 0);
      return totalSum + groupSum;
    }, 0);
  } else {
    // Flat array
    const flatOrders = orders as Order[];
    return flatOrders.reduce((sum, o) => sum + (o.weight_kg || 0), 0);
  }
}
