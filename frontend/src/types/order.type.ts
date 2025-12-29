export enum OrderType {
  NORMAL = "normal",
  URGENT = "urgent",
  EXCHANGE = "exchange",
  PICKUP = "pickup",
}

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
  id: number;
  order_id: number;
  order_number: string;
  quantity: number;
  article: string;
  article_id?: string;
  slmdl_articleordernumber?: string;
  warehouse_id?: string;

  is_new_item?: boolean;
  cancelled_quantity?: number; // qty full/partial cancelled
  ref_item_id?: number;
};

export type Order = {
  order_id: number;
  type: OrderType;
  status: OrderStatus;
  parent_order_id?: number;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_town?: string;

  order_number: string;
  article_sku?: string;

  invoice_amount: string;
  payment_id: number;

  order_time: Date;
  expected_delivery_time: Date;

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

  created_by?: string;
  created_at?: Date;
  updated_at?: Date | null;

  items: OrderItem[];
};

export interface PickupOrderReq {
  order_id: number;
  user_id: string;
  // reason: string;
  items: OrderItem[];
}

export interface PickupOrder {
  order_id: number;
  order_number: string;
  status: string;
  type: string;
  address: string;

  itemsCount: number;
  cancelledItemsCount: number;

  warehouse_id: number;
  warehouse_town: string;

  customer_name: string;
  contact_number: string;
  email: string;

  user_id: string; // email
  created_by: string;
  created_at: string;

  items: OrderItem[];
}

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

export type OrderHistory = {
  id: number;
  order_id: number;
  order_number: number;
  old_status: string;
  new_status: string;
  changed_at: Date;
  changed_by: string; // user email
  reason: string;
  notes: string;
};

export type OrderHistoryUI = {
  order_number: number;
  attempts: {
    order_id: number;
    parent_order_id: number | null;
    type: string;
    statuses: OrderHistory[];
  }[];
};
