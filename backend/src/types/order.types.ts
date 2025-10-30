import { LogisticOrder, OrderStatus } from "../model/LogisticOrders";

export type OrderDetails = {
  order_id: number;
  order_number: string;
  slmdl_article_id: number | string;
  slmdl_articleordernumber: string;
  slmdl_quantity: number;
  warehouse_id: number | string;
};

export type OrderItem = {
  id: string;
  order_id: number;
  order_number: string;
  quantity: number;
  article: string;
  article_id?: string;
  slmdl_articleordernumber?: string;
  warehouse_id?: string;
};

export type Order = {
  order_id: number;
  order_number: string;
  status: OrderStatus;

  article_sku?: string;
  invoice_amount?: string;
  payment_id?: number;

  order_time: Date;
  expected_delivery_time: Date;

  warehouse_id: number;
  warehouse_name?: string;
  warehouse_town?: string;

  quantity?: number;
  article_order_number?: string;
  weight_kg?: number;

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

export type ShopwareOrderDetails = {
  slmdl_article_id: number | string;
  slmdl_articleordernumber: string;
  slmdl_quantity: number;
  warehouse_id: number | string;
};
export type ShopwareOrder = {
  orderID: number | string;
  ordernumber: string;
  invoice_amount: number | string;
  paymentID: number;
  trackingCode?: string | null;
  orderStatusID: number;
  ordertime: Date | string;
  article_sku: string;
  OrderDetails: ShopwareOrderDetails[];
  user_id: string;
  customernumber: string;
  user_email: string;
  user_firstname: string;
  user_lastname: string;

  shipping_salutation: string;
  shipping_firstname: string;
  shipping_lastname: string;
  shipping_street: string;
  shipping_zipcode: string;
  shipping_city: string;
  shipping_phone?: string | null;
};

export function mapShopwareOrderToLogisticOrder(
  order: ShopwareOrder
): LogisticOrder {
  const order_details: any[] = [];
  for (const item of order.OrderDetails) {
    order_details.push({
      slmdl_article_id: item.slmdl_article_id,
      slmdl_articleordernumber: item.slmdl_articleordernumber,
      slmdl_quantity: item.slmdl_quantity,
      warehouse_id: item.warehouse_id,
    });
  }

  const LogisticsOrderObj: LogisticOrder = {
    order_id: 0,
    quantity: 0,
    article_order_number: "",
    lattitude: null,
    longitude: null,
    shopware_order_id: order.orderID,
    order_number: order.ordernumber,
    customer_id: order.user_id,
    invoice_amount: order.invoice_amount.toString(),
    payment_id: order.paymentID,
    tracking_code: order.trackingCode ?? "",
    order_status_id: order.orderStatusID,
    warehouse_id: Number(order.OrderDetails[0].warehouse_id) ?? 0,
    order_time: new Date(order.ordertime),
    article_sku: order.article_sku,
    customer_number: order.customernumber,
    firstname: order.shipping_firstname || order.user_firstname,
    lastname: order.shipping_lastname || order.user_lastname,
    email: order.user_email,
    street: order.shipping_street,
    zipcode: order.shipping_zipcode,
    city: order.shipping_city,
    phone: order.shipping_phone ?? "",
    OrderDetails: order_details,
  };

  return LogisticsOrderObj;
}
