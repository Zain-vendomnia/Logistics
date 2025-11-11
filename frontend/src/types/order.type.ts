export enum OrderStatus {
  initial = "initial",
  unassigned = "unassigned",
  assigned = "assigned",
  inTransit = "inTransit",
  delivered = "delivered",
  rescheduled = "rescheduled",
  Cancelled = "Cancelled",
}

export type OrderItem = {
  id: string;
  order_id: number;
  order_number: string;
  quantity: number;
  article: string;
  article_id?: string;
  warehouse_id?: string;
};

export type Order = {
  order_id: number;
  order_number: string;
  status: OrderStatus;

  invoice_amount: string;
  payment_id: number;

  order_time: Date;
  expected_delivery_time: Date;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_town?: string;

  quantity?: number;
  article_order_number?: string;
  weight_kg?: number;

  customer_id: string;
  customer_number: string;
  firstname: string;
  lastname: string;
  email: string;

  phone: string;
  street: string;
  city: string;
  zipcode: string;

  location: { lat: number; lng: number };

  created_at: Date;

  items: OrderItem[];
};

// export type PinboardOrder = {
//   id: number;
//   order_number: string;

//   order_time: string;
//   delivery_time: string;

//   city: string;
//   zipcode: string;
//   street: string;

//   location: { lat: number; lng: number };
//   warehouse_id: number;
//   warehouse: string;
// };

export type OrderListItem = {
  id: number;
  order_number: string;
  city?: string;
  zipcode?: string;
  street?: string;
};

// export const mapPinboardOrder = (p: PinboardOrder): OrderListItem => ({
//   id: p.id,
//   order_number: p.order_number,
//   city: p.city,
//   zipcode: p.zipcode,
//   street: p.street,
// });

export const mapOrder = (o: Order): OrderListItem => ({
  id: o.order_id,
  order_number: o.order_number,
  city: o.city,
  zipcode: o.zipcode,
  street: o.street,
});
