import { Response } from "express";
import { RowDataPacket } from "mysql2/promise";
import {
  Order,
  OrderHistory,
  OrderItem,
  PickupOrder,
  ShopwareOrder,
} from "../../types/order.types";
import {
  LogisticOrder,
  OrderStatus,
  OrderType,
} from "../../model/LogisticOrders";
import pool from "../../config/database";
import { ApiResponse } from "../../types/apiResponse.type";

export function mapRowToOrderItem(row: RowDataPacket | any): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    order_number: row.order_number,
    quantity: row.quantity,
    article: row.article,
    article_id: row.article_id,
    slmdl_articleordernumber: row.slmdl_articleordernumber,
    warehouse_id: row.warehouse_id,

    cancelled_quantity: row.cancelled_quantity ?? undefined,
    ref_item_id: row.ref_item_id ?? undefined,
    is_new_item: row.is_new_item ?? undefined,
  };
}

export function mapRowToOrder(row: any): Order {
  return {
    order_id: row.order_id,
    type: row.type ?? OrderType.NORMAL,
    status: row.status ?? OrderStatus.Initial,
    parent_order_id: row.parent_order_id ?? null,

    order_number: row.order_number,
    article_sku: row.article_sku,
    // payment_id: row.payment_id ?? null,

    order_time: row.order_time ?? new Date(row.order_time),
    expected_delivery_time:
      row.expected_delivery_time ?? new Date(row.expected_delivery_time),

    warehouse_id: row.warehouse_id ?? null,
    warehouse_name: row.warehouse_name ?? null,
    warehouse_town: row.town ?? null,

    location: { lat: +row.latitude, lng: +row.longitude },

    created_by: row.created_by ?? "Unknown",
    created_at: row.created_at ?? new Date(row.created_at),
    updated_at: row.updated_at ?? new Date(row.created_at),

    customer_id: row.customer_id ?? null,
    customer_number: row.customer_number ?? null,
    firstname: row.firstname ?? null,
    lastname: row.lastname ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    street: row.street ?? null,
    zipcode: row.zipcode ?? null,
    city: row.city ?? null,

    items: [],
  };
}

export async function mapItemsToOrders(orders: Order[], items: OrderItem[]) {
  const [solarModules] = await pool.execute(`SELECT * from solarmodules_items`);

  const orderWithItems: Order[] = orders.map((order) => {
    const orderItems = (items as OrderItem[]).filter(
      (x) => x.order_id === order.order_id
    );

    // const quantity = orderItems.length;
    const quantity = orderItems.reduce((acc, item) => acc + item.quantity, 0);

    let article_order_number = orderItems
      .map((x) => x.slmdl_articleordernumber)
      .join(",");

    article_order_number = article_order_number
      .split(",")
      .map((x) => x?.split("-")[0])
      .join(",");

    const totalWeight = orderItems.reduce((acc, item) => {
      const matchedModule = (solarModules as any[]).find(
        (sm) =>
          item.slmdl_articleordernumber &&
          sm.module_name.includes(item.slmdl_articleordernumber)
      );
      const itemWeight = matchedModule
        ? item.quantity * (matchedModule.weight || 0)
        : 0;

      return acc + itemWeight;
    }, 0);

    return {
      ...order,
      quantity: quantity,
      article_order_number: article_order_number,
      weight_kg: totalWeight,
      items: (items as any[])
        .filter((item) => item.order_id === order.order_id)
        .map(mapRowToOrderItem),
    };
  });

  return orderWithItems;
}

export function mapOrderToPickupOrder(order: Order): PickupOrder {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    type: order.type,
    address: `${order.street}, ${order.city} - zip:${order.zipcode}`,

    warehouse_id: order.warehouse_id,
    warehouse_town: order.warehouse_town ?? "",

    itemsCount: order.items!.reduce((agg, it) => agg + it.quantity, 0),
    cancelledItemsCount: order.items!.reduce(
      (agg, it) => agg + (it.cancelled_quantity ?? 0),
      0
    ),

    customer_name: `${order.firstname} ${order.lastname}`,
    contact_number: order.phone ?? "",
    email: order.email ?? "",

    user_id: order.created_by ?? "",
    created_by: order.created_by ?? "",
    created_at: order.created_at ? String(order.created_at) : "",

    items: order.items ?? [],
  };
}

export function mapRowToOrderHistory(row: any): OrderHistory {
  return {
    id: row.id,
    order_id: row.order_id,
    order_number: row.order_number,
    old_status: row.old_status,
    new_status: row.new_status,
    changed_at: row.changed_at,
    changed_by: row.changed_by_user_id ?? row.changed_by_system ?? "System",
    reason: row.change_reason,
    notes: row.notes,
  };
}

export function validateCancelOrderItem(item: OrderItem): {
  valid: boolean;
  error?: string;
} {
  if (!item.slmdl_articleordernumber?.trim()) {
    return {
      valid: false,
      error: "Each item must have a valid article number",
    };
  }

  if (!item.cancelled_quantity || item.cancelled_quantity <= 0) {
    return {
      valid: false,
      error: `Cancel quantity must be greater than 0 for article ${item.slmdl_articleordernumber}`,
    };
  }

  if (item.cancelled_quantity > item.quantity) {
    return {
      valid: false,
      error: `Cancel quantity (${item.cancelled_quantity}) cannot exceed original quantity (${item.quantity}) for article ${item.slmdl_articleordernumber}`,
    };
  }

  return { valid: true };
}

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
    type: OrderType.NORMAL,
    status: OrderStatus.Initial,
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

export const sendError = (
  res: Response,
  statusCode: number,
  message: string
): void => {
  res.status(statusCode).json({
    status: "error",
    message,
    statusCode,
  });
};

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): void => {
  const response: ApiResponse = {
    status: "success",
    message,
    statusCode,
    ...(data && { data }),
  };
  res.status(statusCode).json(response);
};
