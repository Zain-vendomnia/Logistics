import pool from "../config/database";
import { Order, OrderItem, PickupOrder } from "../types/order.types";
import { LogisticOrder, OrderStatus, OrderType } from "../model/LogisticOrders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  mapItemsToOrders,
  mapOrderToPickupOrder,
  mapRowToOrder,
  mapRowToOrderItem,
} from "./helpers/logisticOrder.helper";
export async function loadOrderItems(orders: Order[]) {
  const placeholders = orders.map(() => "?").join(",");
  const [items] = await pool.execute(
    `SELECT * FROM logistic_order_items WHERE order_id IN (${placeholders})`,
    orders.map((o) => o.order_id)
  );

  const ordersWithItems = await mapItemsToOrders(
    orders as Order[],
    items as OrderItem[]
  );

  return ordersWithItems;
}

// Order Status History
export async function createOrderStatusHistory(
  orderId: number,
  oldStatus: string | null = null,
  newStatus: OrderStatus,
  changedBy: string | "auto-assigner" | "webhook",
  reason: string | null = null,
  conn?: PoolConnection,
  notes?: string
): Promise<void> {
  const connection: PoolConnection = conn ?? (await pool.getConnection());
  notes = notes ?? "";

  const changeBy_field =
    changedBy === "auto-assigner" || changedBy === "webhook"
      ? "changed_by_system"
      : "changed_by_user_id";

  const query = `
    INSERT INTO order_status_history 
    (order_id, old_status, new_status, ${changeBy_field}, change_reason, notes) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await connection.execute(query, [
    orderId,
    oldStatus,
    newStatus,
    changedBy,
    reason,
    notes,
  ]);
}

export async function updateOrderStatus({
  orderId,
  newStatus,
  changedBy = "auto-assigner",
  reason = null,
  conn,
}: {
  orderId: number;
  newStatus: OrderStatus;
  changedBy?: string | "auto-assigner" | "webhook";
  reason?: string | null;
  notes?: string | null;
  conn?: PoolConnection;
}): Promise<Boolean> {
  const connection = conn ?? (await pool.getConnection());
  // get current status
  const [[order]]: any = await pool.query(
    "SELECT status FROM logistic_order WHERE order_id = ?",
    [orderId]
  );

  if (!order) throw new Error("Order not found");

  if (order.status === newStatus) return true; // avoid duplicate transitions

  // update status
  const [result] = await connection.execute(
    "UPDATE logistic_order SET status = ?, updated_at = NOW() WHERE order_id = ?",
    [newStatus, orderId]
  );

  // log transition
  await createOrderStatusHistory(
    orderId,
    order.status,
    newStatus,
    changedBy,
    reason,
    connection
  );

  return (result as ResultSetHeader).affectedRows > 0;
}

// Start: Order Types
export async function createExchangeOrder(
  parentOrderId: number,
  createdBy: string,
  reason = "exchange requested",
  cancelItems: OrderItem[]
): Promise<{ success: boolean; message: string } | Order> {
  const conn = await pool.getConnection();
  try {
    if (!createdBy || createdBy === null)
      return { success: false, message: "User id required" };

    await conn.beginTransaction();

    const verify = await verifyOrderAndItems(
      parentOrderId,
      OrderType.EXCHANGE,
      conn,
      cancelItems
    );
    if (!verify.success) {
      await conn.rollback();
      return verify;
    }

    const newOrderId = await cloneOrderWithType({
      parentOrderId,
      type: OrderType.EXCHANGE,
      createdBy,
      reason,
      conn,
    });
    if (
      !newOrderId ||
      typeof newOrderId !== "number" ||
      !Number.isFinite(newOrderId)
    ) {
      await conn.rollback();
      return { success: false, message: "Failed to create new order" };
    }

    await cloneOrderItems(parentOrderId, newOrderId, cancelItems, conn);

    await conn.commit();
    return { success: true, message: "Pickup order created" };
  } catch (error: unknown) {
    await conn.rollback();
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    conn.release();
  }
}

export async function createPickupOrder(
  parentOrderId: number,
  createdBy: string,
  reason: string = "Cancel order request",
  cancelItems: OrderItem[]
): Promise<
  | { success: boolean; message: string }
  | { success: boolean; data: PickupOrder; message: string }
> {
  const conn = await pool.getConnection();
  try {
    if (!createdBy || createdBy === null)
      return { success: false, message: "User id required" };

    await conn.beginTransaction();

    const verify = await verifyOrderAndItems(
      parentOrderId,
      OrderType.PICKUP,
      conn,
      cancelItems
    );
    if (!verify.success) {
      await conn.rollback();
      return verify;
    }

    const newOrderId = await cloneOrderWithType({
      parentOrderId,
      type: OrderType.PICKUP,
      createdBy,
      reason,
      conn,
    });
    if (
      !newOrderId ||
      typeof newOrderId !== "number" ||
      !Number.isFinite(newOrderId)
    ) {
      await conn.rollback();
      return { success: false, message: "Failed to create new order" };
    }

    await cloneOrderItems(parentOrderId, newOrderId, cancelItems, conn);

    await conn.commit();

    const orders = await LogisticOrder.getOrdersWithItemsAsync([newOrderId]);
    const pickUpOrder = orders.map(mapOrderToPickupOrder)[0];

    return {
      success: true,
      data: pickUpOrder,
      message: "Pickup order created",
    };
  } catch (error: unknown) {
    await conn.rollback();
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    conn.release();
  }
}

export async function cloneOrderWithType({
  parentOrderId,
  type,
  createdBy,
  reason = null,
  conn,
}: {
  parentOrderId: number;
  type: "exchange" | "pickup";
  createdBy: string;
  reason: string | null;
  conn: PoolConnection;
}): Promise<number | string | undefined> {
  await updateOrderStatus({
    orderId: parentOrderId,
    newStatus: OrderStatus.Cancelled,
    changedBy: createdBy,
    reason,
    conn,
  });

  const sql = `
    INSERT INTO logistic_order
      (type, status, parent_order_id, shopware_order_id, order_number,
       article_sku, tracking_code, order_status_id, warehouse_id,
       order_time, expected_delivery_time, payment_id, invoice_amount,
       customer_id, customer_number, firstname, lastname, street, zipcode,
       city, phone, email, latitude, longitude, created_by, created_at)
    SELECT
       ?, ?, order_id, shopware_order_id, order_number,
       article_sku, tracking_code, order_status_id, warehouse_id,
       order_time, expected_delivery_time, payment_id, invoice_amount,
       customer_id, customer_number, firstname, lastname, street, zipcode,
       city, phone, email, latitude, longitude, ?, NOW()
    FROM logistic_order
    WHERE order_id = ?
  `;

  const values = [type, OrderStatus.Initial, createdBy, parentOrderId];

  const [result]: any = await conn.execute(sql, values);

  const newOrderId = result.insertId;

  await createOrderStatusHistory(
    newOrderId,
    null,
    OrderStatus.Initial,
    createdBy,
    reason,
    conn
  );

  return newOrderId;
}

async function verifyOrderAndItems(
  orderId: number,
  type: OrderType,
  conn: PoolConnection,
  cancelItems?: OrderItem[]
): Promise<{ success: boolean; message: string }> {
  const [[order]]: any = await conn.query(
    "SELECT status, type FROM logistic_order WHERE order_id = ?",
    [orderId]
  );
  if (!order) return { success: false, message: "Order not found" };

  if (order.status === OrderStatus.Cancelled || order.type === type)
    return { success: false, message: "Order is setteled already." };

  if (cancelItems && cancelItems.length > 0) {
    for (const item of cancelItems) {
      const [rows]: any = await conn.query(
        `SELECT quantity FROM logistic_order_items
     WHERE order_id = ? AND slmdl_articleordernumber = ? LIMIT 1`,
        [orderId, item.slmdl_articleordernumber]
      );
      const orderItem = rows?.[0];
      if (!orderItem) {
        return {
          success: false,
          message: `Article ${item.slmdl_articleordernumber} not found in order id: ${orderId}`,
        };
      }
      if ((item.cancelled_quantity ?? 0) > orderItem.quantity) {
        return {
          success: false,
          message: `Cancel quantity (${item.cancelled_quantity}) exceeds order quantity (${orderItem.quantity}) for article ${item.slmdl_articleordernumber}`,
        };
      }
    }
  }

  return { success: true, message: "verified" };
}

async function cloneOrderItems(
  parentOrderId: number,
  newOrderId: number,
  cancelItems: OrderItem[],
  conn: PoolConnection
) {
  const [parentOrderItems]: any = await conn.query(
    `SELECT * FROM logistic_order_items WHERE order_id = ?`,
    [parentOrderId]
  );

  for (const parentItem of parentOrderItems) {
    const cancelItem = cancelItems.find(
      (i) => i.slmdl_articleordernumber === parentItem.slmdl_articleordernumber
    );

    const mappedItem = {
      order_id: newOrderId,
      order_number: parentItem.order_number, // unchanged
      // article: parentItem.article,
      // article_id: parentItem.article_id,
      slmdl_articleordernumber: parentItem.slmdl_articleordernumber,
      warehouse_id: parentItem.warehouse_id,

      quantity: parentItem.quantity, // original qty
      cancelled_quantity: cancelItem?.cancelled_quantity ?? 0,

      is_new_item: false, // because pickup means collecting items
      ref_item_id: parentItem.id,
    };
    // article, article_id,
    await conn.query(
      `
      INSERT INTO logistic_order_items
      (order_id, order_number, quantity,
       slmdl_articleordernumber, warehouse_id,
       cancelled_quantity, is_new_item, ref_item_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        mappedItem.order_id,
        mappedItem.order_number,
        mappedItem.quantity,
        // mappedItem.article,
        // mappedItem.article_id,
        mappedItem.slmdl_articleordernumber,
        mappedItem.warehouse_id,
        mappedItem.cancelled_quantity,
        mappedItem.is_new_item,
        mappedItem.ref_item_id,
      ]
    );
  }
}

// Order items update
// For pick and exchange order types
export async function updateOrderItemsQty(
  order_id: number,
  update_by: string,
  cancelItems: OrderItem[] // updated items only
): Promise<{
  success: boolean;
  updatedItems?: Map<number, boolean>;
  message?: string;
}> {
  if (!order_id || !update_by) {
    return { success: false, message: "Missing orderId or update_by" };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const updatedItem = new Map<number, boolean>();

    // Validate order
    const [orderRows] = await conn.execute<RowDataPacket[]>(
      "SELECT status FROM logistic_order WHERE id = ?",
      [order_id]
    );
    if (!orderRows.length) {
      await conn.rollback();
      return { success: false, message: "Invalid order id" };
    }
    if (orderRows[0].status === OrderStatus.Cancelled) {
      await conn.rollback();
      return { success: false, message: "Order is Cancelled already." };
    }

    if (!cancelItems?.length) {
      await conn.rollback();
      return { success: false, message: "Cancel items not provided" };
    }

    // Fetch all order items for the order
    const [parentItems] = await conn.execute<RowDataPacket[]>(
      `SELECT * FROM logistic_order_items WHERE order_id = ?`,
      [order_id]
    );

    const itemsMap = new Map<number, OrderItem>();
    parentItems.forEach((item: any) =>
      itemsMap.set(item.id, mapRowToOrderItem(item))
    );

    // Validate cancel quantities
    for (const cancelItem of cancelItems) {
      const orderItem = itemsMap.get(cancelItem.id);
      if (!orderItem) {
        if (!cancelItem.quantity || cancelItem.quantity <= 0) {
          await conn.rollback();
          return { success: false, message: "New item quantity must be > 0" };
        }
        continue;
      }

      if (
        !cancelItem.cancelled_quantity ||
        (cancelItem.cancelled_quantity ?? 0) <= 0
      ) {
        await conn.rollback();
        return { success: false, message: `Cancel quantity must be > 0` };
      }

      if (cancelItem.cancelled_quantity > orderItem.quantity) {
        await conn.rollback();
        return {
          success: false,
          message: `Cancel quantity (${cancelItem.cancelled_quantity}) cannot exceed original quantity (${orderItem.quantity}) for item ${cancelItem.id}`,
        };
      }
    }

    // Update items in batch
    for (const cancelItem of cancelItems) {
      const orderItem = itemsMap.get(cancelItem.id);
      // Exchange Case: add new order item
      if (!orderItem) {
        const newItemQuery = `
      INSERT INTO logistic_order_items
      (order_id, order_number, quantity, article,
       article_id, slmdl_articleordernumber, warehouse_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        const [result] = await conn.execute<ResultSetHeader>(newItemQuery, [
          cancelItem.order_id,
          cancelItem.order_number,
          cancelItem.quantity,
          cancelItem.article,
          cancelItem.article_id,
          cancelItem.slmdl_articleordernumber,
          cancelItem.warehouse_id,
        ]);

        updatedItem.set(result.insertId, true);
        continue;
      }

      const [result] = await conn.execute<ResultSetHeader>(
        `UPDATE logistic_order_items SET cancelled_quantity = ? WHERE id = ?`,
        [cancelItem.cancelled_quantity, cancelItem.id]
      );
      updatedItem.set(cancelItem.id, result.affectedRows > 0);
    }

    await conn.commit();
    return { success: true, updatedItems: updatedItem };
  } catch (err: unknown) {
    await conn.rollback();
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    conn.release();
  }
}
// End: Order Types

export async function getOrdersByTypes(
  types: OrderType[]
): Promise<Order[] | PickupOrder[]> {
  if (!types?.length) return [];

  // Use IN clause
  const placeholders = types.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT * FROM logistic_order WHERE type IN (${placeholders})`,
    types
  );
  const orders: Order[] = (rows as any[]).map(mapRowToOrder);
  const ordersWithItems = await loadOrderItems(orders);

  const containsPickupOrExchange =
    types.includes(OrderType.PICKUP) || types.includes(OrderType.EXCHANGE);
  if (containsPickupOrExchange) {
    const pickupOrders = ordersWithItems.map(mapOrderToPickupOrder);
    return pickupOrders;
  }

  return ordersWithItems;
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  if (!status) return [];

  const [rows] = await pool.execute(
    `SELECT * FROM logistic_order
     JOIN warehouse_details wh
        ON o.warehouse_id = wh.warehouse_id
    WHERE status = ?`,
    status
  );
  const orders: Order[] = (rows as any[]).map(mapRowToOrder);
  const ordersWithItems = await loadOrderItems(orders);
  return ordersWithItems;
}

export async function getOrderId(order_number: number) {
  const orderQuery = `SELECT order_id, status 
       FROM logistic_order 
       WHERE order_number = ? 
       ORDER BY order_id DESC 
       LIMIT 1`;
  const [orderRows] = await pool.query<RowDataPacket[]>(orderQuery, [
    order_number,
  ]);

  if (orderRows.length === 0) {
    return null;
  }

  const order: Order = orderRows.map(mapRowToOrder)[0];
  if (order.status === OrderStatus.Cancelled) return null;

  return order.order_id;
}

export async function fetchOrderDetailsAsync(order_number: number) {
  const order_id = await getOrderId(order_number);
  if (!order_id) return null;

  const details = await LogisticOrder.getOrdersWithItemsAsync([order_id]);

  return details[0];
}

export async function getCancelOrderItemsAsync(orderNumber: number) {
  const data = await fetchOrderDetailsAsync(orderNumber);

  if (!data) throw new Error("invalid order number");

  const pickupItems = mapOrderToPickupOrder(data).items;
  return pickupItems;
}
