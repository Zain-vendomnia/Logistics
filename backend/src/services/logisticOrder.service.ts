import pool from "../config/database";
import {
  Order,
  OrderItem,
  PickupOrder,
  OrderHistory,
  OrderHistoryUI,
  SolarModule,
} from "../types/order.types";
import { LogisticOrder, OrderStatus, OrderType } from "../model/LogisticOrders";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  mapItemsToOrders,
  mapOrderToPickupOrder,
  mapRowToOrder,
  mapRowToOrderHistory,
  mapRowToOrderItem,
} from "../helpers/logisticOrder.helper";
import { isUrgentDelivery } from "../utils/orderUtils";

export async function loadOrdersItems(orders: Order[]) {
  const placeholders = orders.map(() => "?").join(",");
  const [items] = await pool.execute(
    `SELECT * FROM logistic_order_items WHERE order_id IN (${placeholders})`,
    orders.map((o) => o.order_id),
  );

  const ordersWithItems = await mapItemsToOrders(
    orders as Order[],
    items as OrderItem[],
  );

  return ordersWithItems;
}

// Order Status History
export async function createOrderStatusHistory({
  orderId,
  oldStatus = null,
  newStatus,
  changedBy,
  reason = null,
  notes = null,
  conn,
}: {
  orderId: number;
  oldStatus: string | null;
  newStatus: OrderStatus;
  changedBy: string | "auto-assigner" | "webhook";
  reason: string | null;
  notes?: string | null;
  conn?: PoolConnection;
}): Promise<void> {
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
  notes = null,
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
    [orderId],
  );

  if (!order) throw new Error("Order not found");

  if (order.status === newStatus) return true; // avoid duplicate transitions

  // update status
  const [result] = await connection.execute<ResultSetHeader>(
    "UPDATE logistic_order SET status = ?, updated_at = NOW() WHERE order_id = ?",
    [newStatus, orderId],
  );

  const affected = (result as ResultSetHeader).affectedRows > 0;
  // log transition
  if (affected) {
    await createOrderStatusHistory({
      orderId,
      oldStatus: order.status,
      newStatus,
      changedBy,
      reason,
      notes,
      conn: connection,
    });
  }
  return affected;
}

// Start: Order Types
// export async function createPickupOrder(
//   parentOrderId: number,
//   createdBy: string,
//   reason: string = "Cancel order request",
//   cancelItems: OrderItem[]
// ): Promise<
//   | { success: boolean; message: string }
//   | { success: boolean; data: PickupOrder; message: string }
// > {
//   const conn = await pool.getConnection();
//   try {
//     if (!createdBy || createdBy === null)
//       return { success: false, message: "User id required" };

//     await conn.beginTransaction();

//     const verify = await verifyOrderAndItems(
//       parentOrderId,
//       OrderType.PICKUP,
//       conn,
//       cancelItems
//     );
//     if (!verify.success) {
//       await conn.rollback();
//       return verify;
//     }

//     const newOrderId = await cloneOrderWithType({
//       parentOrderId,
//       type: OrderType.PICKUP,
//       createdBy,
//       reason,
//       conn,
//     });
//     if (
//       !newOrderId ||
//       typeof newOrderId !== "number" ||
//       !Number.isFinite(newOrderId)
//     ) {
//       await conn.rollback();
//       return { success: false, message: "Failed to create new order" };
//     }

//     await cloneOrderItems(parentOrderId, newOrderId, cancelItems, conn);

//     await conn.commit();

//     const orders = await LogisticOrder.getOrdersWithItemsAsync([newOrderId]);
//     const pickUpOrder = orders.map(mapOrderToPickupOrder)[0];

//     return {
//       success: true,
//       data: pickUpOrder,
//       message: "Pickup order created",
//     };
//   } catch (error: unknown) {
//     await conn.rollback();
//     return {
//       success: false,
//       message: error instanceof Error ? error.message : String(error),
//     };
//   } finally {
//     conn.release();
//   }
// }

export async function createCancelOrderAsync(
  parentOrderId: number,
  createdBy: string,
  reason = "",
  items: OrderItem[],
): Promise<{ success: boolean; message: string } | Order> {
  const conn = await pool.getConnection();
  try {
    if (!createdBy || createdBy === null)
      return { success: false, message: "User id required" };

    const order = await LogisticOrder.getOrdersWithItemsAsync([parentOrderId]);
    if (order[0].status === OrderStatus.Cancelled)
      return {
        success: false,
        message: `Order ${order[0].order_number} was setteled already. Status: ${order[0].status}`,
      };

    const orderItems = order[0].items;
    const existingItemIds = new Set(orderItems?.map((oi) => oi.id));
    const addonItems = items.filter(
      (it) => it.id === 0 && !existingItemIds.has(it.id),
    );
    const cancelItems = items.filter((oit) => existingItemIds.has(oit.id));

    if (!cancelItems)
      return {
        success: false,
        message: `Order ${order[0].order_number} not iligible for Pickup or Exchange`,
      };

    const verifyOit = await verifyOrderItems(parentOrderId, cancelItems);
    if (!verifyOit.success) {
      return verifyOit;
    }
    if (verifyOit.dontExist && verifyOit.dontExist.length > 0) {
    }

    await conn.beginTransaction();

    // Exchange Order
    // Create new order on Shopware for a new order_number | (webhook||api)
    if (addonItems && addonItems.length > 0) {
      const newExOrderId = await cloneOrderWithType({
        parentOrderId,
        type: OrderType.EXCHANGE,
        createdBy,
        reason,
        conn,
      });

      if (
        !newExOrderId ||
        typeof newExOrderId !== "number" ||
        !Number.isFinite(newExOrderId)
      ) {
        await conn.rollback();
        return { success: false, message: "Failed to create new order" };
      }
    }

    if (cancelItems.length > 0) {
      const newPickupOrderId = await cloneOrderWithType({
        parentOrderId,
        type: OrderType.PICKUP,
        createdBy,
        reason,
        conn,
      });
      if (
        !newPickupOrderId ||
        typeof newPickupOrderId !== "number" ||
        !Number.isFinite(newPickupOrderId)
      ) {
        await conn.rollback();
        return { success: false, message: "Failed to create new order" };
      }

      await cloneOrderItems(parentOrderId, newPickupOrderId, cancelItems, conn);
    }

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

  await createOrderStatusHistory({
    orderId: newOrderId,
    oldStatus: null,
    newStatus: OrderStatus.Initial,
    changedBy: createdBy,
    reason,
    conn,
  });

  return newOrderId;
}

export async function verifyOrder(
  orderId: number,
  type?: OrderType,
): Promise<{ success: boolean; message: string }> {
  const [[order]]: any = await pool.query(
    "SELECT status, type FROM logistic_order WHERE order_id = ?",
    [orderId],
  );
  if (!order) return { success: false, message: "Order not found" };

  if (order.status === OrderStatus.Cancelled)
    return {
      success: false,
      message: `Order ${order.order_number} was setteled already. Status: ${order.status}`,
    };

  // verify order type
  if (type && order.type !== type)
    return {
      success: false,
      message: `Order ${order.order_number} conflicts with type provided.`,
    };

  return { success: true, message: "verified" };
}

export async function verifyOrderItems(
  orderId: number,
  cancelItems: OrderItem[],
): Promise<{ success: boolean; message: string; dontExist?: OrderItem[] }> {
  const dontExist: OrderItem[] = [];

  if (cancelItems.length === 0)
    return { success: false, message: "invalid cancel items." };

  for (const item of cancelItems) {
    const [rows]: any = await pool.query(
      `SELECT quantity FROM logistic_order_items
     WHERE order_id = ? AND slmdl_articleordernumber = ? LIMIT 1`,
      [orderId, item.slmdl_articleordernumber],
    );
    const orderItem = rows?.[0];
    if (!orderItem) {
      dontExist.push(item);
      // return {
      //   success: false,
      //   message: `Article ${item.slmdl_articleordernumber} not found in order id: ${orderId}`,
      // };
    }
    if ((item.cancelled_quantity ?? 0) > orderItem.quantity) {
      return {
        success: false,
        message: `Cancel quantity (${item.cancelled_quantity}) exceeds order quantity (${orderItem.quantity}) for article ${item.slmdl_articleordernumber}`,
      };
    }
  }

  return { success: true, message: "verified", dontExist };
}

async function cloneOrderItems(
  parentOrderId: number,
  newOrderId: number,
  cancelItems: OrderItem[],
  conn: PoolConnection,
) {
  const [parentOrderItems]: any = await conn.query(
    `SELECT * FROM logistic_order_items WHERE order_id = ?`,
    [parentOrderId],
  );

  for (const parentItem of parentOrderItems) {
    const cancelItem = cancelItems.find(
      (i) => i.slmdl_articleordernumber === parentItem.slmdl_articleordernumber,
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
      ],
    );
  }
}

// Order items update
// For pick and exchange order types
export async function updateOrderItemQty(
  order_id: number,
  orderItemId: number,
  cancel_quantity: number,
  updated_by: string,
): Promise<{
  success: boolean;
  updatedItems?: Map<number, boolean>;
  message?: string;
}> {
  if (!orderItemId || !updated_by) {
    return { success: false, message: "Missing orderId or update_by" };
  }

  const orderResult = await LogisticOrder.getOrdersWithItemsAsync([order_id]);
  const order = orderResult[0];

  const orderItemIds = new Set(order.items?.map((item) => item.id));
  if (!orderItemIds.has(orderItemId)) {
    return { success: false, message: "Invalid order item for ref order" };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM logistic_order_items WHERE id = ?`,
      [orderItemId],
    );
    const orderItem = (rows as any).map(mapRowToOrderItem)[0];
    if (!orderItem) {
      return { success: false, message: "Cancel item not found" };
    }

    if (cancel_quantity <= 0 || cancel_quantity > orderItem.quantity) {
      return {
        success: false,
        message: `Order item ${orderItem.id} cannot process for quantity (${cancel_quantity})`,
      };
    }

    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE logistic_order_items SET cancelled_quantity = ?, updated_at = NOW() WHERE id = ?`,
      [cancel_quantity, orderItemId],
    );

    if (result.affectedRows > 0) {
      await conn.commit();

      //update order history
      createOrderStatusHistory({
        orderId: order_id,
        oldStatus: order.status,
        newStatus: order.status,
        changedBy: updated_by,
        reason: "Order Item Qty Update",
        notes: `OrderItem ${orderItem.id} cancel quantity updated to ${cancel_quantity}`,
        conn,
      });

      return { success: true };
    }
    return { success: false };
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

export async function updatePickupOrderItems(
  order_id: number,
  update_by: string,
  cancelItems: OrderItem[], // updated items only
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
      [order_id],
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
      [order_id],
    );

    const itemsMap = new Map<number, OrderItem>();
    parentItems.forEach((item: any) =>
      itemsMap.set(item.id, mapRowToOrderItem(item)),
    );

    // Validate cancel quantities
    for (const cancelItem of cancelItems) {
      const orderItem = itemsMap.get(cancelItem.id);
      if (!orderItem) {
        if (
          !cancelItem.quantity ||
          !cancelItem.cancelled_quantity ||
          cancelItem.quantity <= 0 ||
          cancelItem.cancelled_quantity <= 0
        ) {
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
        [cancelItem.cancelled_quantity, cancelItem.id],
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
  types: OrderType[],
): Promise<Order[] | PickupOrder[]> {
  if (!types?.length) return [];

  // Use IN clause
  const placeholders = types.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT * FROM logistic_order WHERE type IN (${placeholders})`,
    types,
  );
  const orders: Order[] = (rows as any[]).map(mapRowToOrder);
  const ordersWithItems = await loadOrdersItems(orders);

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
    status,
  );
  const orders: Order[] = (rows as any[]).map(mapRowToOrder);
  const ordersWithItems = await loadOrdersItems(orders);
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
  // if (order.status === OrderStatus.Cancelled) return null;

  return order.order_id;
}

export async function fetchOrderDetailsAsync(order_number: number) {
  const order_id = await getOrderId(order_number);
  if (!order_id) return null;

  const details = await LogisticOrder.getOrdersWithItemsAsync([order_id]);

  return details[0];
}

export async function fetchOrderHistoryAsync(
  order_number: number,
): Promise<OrderHistoryUI | null> {
  const orderQuery = `SELECT * FROM logistic_order WHERE order_number = ?`;
  const [orderRows] = await pool.execute(orderQuery, [order_number]);
  const orders = (orderRows as any[]).map(mapRowToOrder);

  if (!orders.length) return null;

  const sortedOrders = sortOrdersByHierarchy(orders);
  const orderIds = sortedOrders.map((o) => o.order_id);

  const placeholders = orders.map(() => "?").join(",");
  const historyQuery = `SELECT * FROM order_status_history WHERE order_id IN (${placeholders})`;
  const [historyRows] = await pool.execute(historyQuery, orderIds);
  const historyObjs = (historyRows as any).map(mapRowToOrderHistory);

  if (!historyObjs.length) return null;

  const historyByOrder = new Map<Number, OrderHistory[]>();
  for (const h of historyObjs) {
    if (!historyByOrder.has(h.order_id)) historyByOrder.set(h.order_id, []);
    historyByOrder.get(h.order_id)?.push(h);
  }

  // Sort orders statuses by date
  for (const histories of historyByOrder.values()) {
    histories.sort((a, b) => a.changed_at.getTime() - b.changed_at.getTime());
  }

  // const finalHistory: OrderHistory[] = [];
  // for (const order of sortedOrders) {
  //   const histories = historyByOrder.get(order.order_id) ?? [];
  //   finalHistory.push(...histories);
  // }
  // return finalHistory;

  const attempts = sortedOrders.map((order) => ({
    order_id: order.order_id,
    parent_order_id: order.parent_order_id ?? 0,
    type: order.type,
    statuses: historyByOrder.get(order.order_id) ?? [],
  }));

  return { order_number, attempts } as OrderHistoryUI;
}

function sortOrdersByHierarchy(orders: Order[]): Order[] {
  const byParent = new Map<number | null, Order[]>();
  for (const order of orders) {
    const parentId = order.parent_order_id ?? null;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId)!.push(order);
  }

  const result: Order[] = [];

  function dfs(parentId: number | null) {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push(child);
      dfs(child.order_id);
    }
  }

  dfs(null); // start from root orders
  return result;
}

export async function getCancelOrderItemsAsync(orderNumber: number) {
  const data = await fetchOrderDetailsAsync(orderNumber);

  if (!data) throw new Error("invalid order number");

  const pickupItems = mapOrderToPickupOrder(data).items;
  return pickupItems;
}

export async function updateOrderStatusAsync(
  order_id: number,
  newStatus: string,
  updated_by: string,
) {
  try {
    const isUpdated = await updateOrderStatus({
      orderId: order_id,
      newStatus: newStatus as OrderStatus,
      changedBy: updated_by,
      reason: "System test operations",
    });

    if (!isUpdated)
      return {
        success: false,
        message: "Internal server error.",
      };

    return {
      success: true,
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      status: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

async function markOrderAsUrgent(order: Order): Promise<Boolean> {
  if (!order) throw new Error("Order not found");
  if (order.type === OrderType.URGENT) return false;

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE logistic_order 
      SET type = ?, updated_at = NOW() 
    WHERE order_id = ? AND type != ?`,
    [OrderType.URGENT, order.order_id, OrderType.URGENT],
  );

  const affected = (result as ResultSetHeader).affectedRows > 0;
  if (affected) {
    await createOrderStatusHistory({
      orderId: order.order_id,
      oldStatus: order.status,
      newStatus: order.status,
      changedBy: "auto-assigner",
      reason: "Marked order as Urgent.",
    });
  }
  return affected;
}

export async function checkOrdersUrgency() {
  const orders: Order[] = await LogisticOrder.getPendingOrdersAsync();

  const urgentDeliveries = orders.filter(
    (order) =>
      isUrgentDelivery(order.expected_delivery_time) &&
      order.type !== OrderType.URGENT,
  );

  if (!urgentDeliveries.length) return;

  await Promise.all(urgentDeliveries.map((o) => markOrderAsUrgent(o)));
}

export async function addSolarModuleAsync(
  module: SolarModule,
): Promise<SolarModule> {
  const query = `
    INSERT INTO solarmodules_items
      (module_name, weight, created_at)
    VALUES (?, ?, NOW())
  `;

  const [result] = await pool.execute<ResultSetHeader>(query, [
    module.name,
    module.weight,
    module.updated_by,
  ]);

  return {
    ...module,
    id: result.insertId,
  };
}

export async function updateSolarModuleAsync(
  module: SolarModule,
): Promise<SolarModule> {
  if (!module.id) {
    throw new Error("SolarModule ID is required for update");
  }

  const query = `
    UPDATE solarmodules_items
    SET
      module_name = ?,
      weight = ?,
      updated_at = NOW(),
      updated_by = ?
    WHERE id = ?
  `;

  const [result] = await pool.execute<ResultSetHeader>(query, [
    module.name,
    module.weight,
    module.updated_by,
    module.id,
  ]);

  if (result.affectedRows === 0) {
    throw new Error(`No SolarModule found with id ${module.id}`);
  }

  return module;
}

export async function fetchSolarModulesAsync(): Promise<SolarModule[]> {
  const [rows] = await pool.execute(`SELECT * from solarmodules_items`);

  const modules: SolarModule[] = (rows as any[]).map((row) => ({
    id: row.id,
    name: row.module_name,
    short_name: row.module_name.split("-")[0] ?? row.module_name,
    weight: row.weight,
    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by: row.update_by,
  }));

  return modules;
}
