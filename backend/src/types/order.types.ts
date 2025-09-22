import { OrderStatus } from "../model/LogisticOrders";

export type OrderItem = {
  id: string;
  order_id: number;
  order_number: string;
  quantity: number;
  article_id: string;
  article: string;
  warehouse_id: string;
};

export type Order = {
  order_id: number;
  order_number: string;
  status: OrderStatus;

  invoice_amount?: string;
  payment_id?: number;

  order_time: Date;
  expected_delivery_time: Date;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_town?: string;

  quantity?: number;
  article_order_number?: string;

  customer_id?: string;
  customer_number?: string;
  firstname?: string;
  lastname?: string;
  email?: string;

  phone?: string;
  street?: string;
  city: string;
  zipcode: string;

  location: { lat: number; lng: number };

  created_at?: Date;

  items?: OrderItem[];
};
