import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { CheckOrderCount } from "../types/dto.types";
import { Order, OrderItem } from "../types/order.types";
import { PoolConnection } from "mysql2/promise";
import { geocode } from "../services/hereMap.service";
// import { isUrgentDelivery } from "../utils/orderUtils";
import logger from "../config/logger";
import {
  loadOrderItems,
  updateOrderStatus,
} from "../services/logisticOrder.service";
import {
  mapItemsToOrders,
  mapRowToOrder,
} from "../services/helpers/logisticOrder.helper";

export enum OrderType {
  NORMAL = "normal",
  URGENT = "urgent",
  EXCHANGE = "exchange",
  PICKUP = "pickup",
}

export enum OrderStatus {
  Initial = "initial",
  InProcess = "inProcess",
  Assigned = "assigned",
  Unassigned = "unassigned",
  InTransit = "inTransit",
  Delivered = "delivered",
  Rescheduled = "rescheduled",
  Cancelled = "cancelled",
}

export type OrderDetails = {
  id: number;
  order_id: number;
  order_number: string;
  slmdl_article_id: number | string;
  slmdl_articleordernumber: string;
  slmdl_quantity: number;
  warehouse_id: number | string;

  // is_new_item?: boolean;
  // cancelled_quantity?: number; // qty full/partial cancelled
  // ref_item_id?: number;
};

export class LogisticOrder {
  public order_id!: number;
  public type: OrderType = OrderType.NORMAL;
  public status: OrderStatus = OrderStatus.Initial;
  public parent_order_id?: number;

  public shopware_order_id!: number | string;
  public order_number!: string;
  public article_sku!: string;
  public tracking_code!: string;
  public order_status_id!: number;
  public warehouse_id!: number;

  public order_time!: Date;
  public expected_delivery_time?: Date;
  public payment_id!: number;
  public quantity!: number;
  public article_order_number!: string;

  public invoice_amount!: string;
  public customer_id!: string;
  public customer_number!: string;
  public firstname!: string;
  public lastname!: string;
  public phone!: string;
  public email!: string;
  public street!: string;
  public zipcode!: string;
  public city!: string;

  public lattitude: number | null = null;
  public longitude: number | null = null;

  public created_by?: string;
  public created_at?: Date;
  public updated_at?: Date | null;

  public OrderDetails: OrderDetails[] = [];

  // Get all logistic orders with items information
  static async getAll(): Promise<any[]> {
    const [rows] = await pool.execute(`
    SELECT 
      lo.*, 
      wd.warehouse_name,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'driver_id', dd.id,
          'driver_name', dd.name,
          'driver_mobile', dd.mob,
          'driver_address', dd.address,
          'warehouse_id', dd.warehouse_id
        )
      ) AS drivers,
      (
        SELECT GROUP_CONCAT(loi.slmdl_articleordernumber SEPARATOR ', ')
        FROM logistic_order_items loi
        WHERE loi.order_id = lo.order_id
      ) AS article_order_numbers,
      (
        SELECT SUM(loi.quantity)
        FROM logistic_order_items loi
        WHERE loi.order_id = lo.order_id
      ) AS total_quantity
    FROM logistic_order lo
    INNER JOIN driver_details dd 
      ON lo.warehouse_id = dd.warehouse_id
    INNER JOIN warehouse_details wd 
      ON lo.warehouse_id = wd.warehouse_id
    GROUP BY lo.order_id, lo.warehouse_id
  `);
    return rows as any[];
  }

  static async getAllLogisticOrders(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute(`SELECT * FROM logistic_order`);

    return rows as LogisticOrder[];
  }

  static async checkLastCreatedAt(): Promise<string | null> {
    const query = `
    SELECT created_at AS lastCreatedAt
    FROM logistic_order
    ORDER BY created_at DESC, order_id DESC
    LIMIT 1;
   `;

    const [rows]: any = await pool.execute(query);

    if (rows.length === 0) {
      return null;
    }

    return rows[0].lastCreatedAt as string;
  }

  static async createOrderAsync(order: LogisticOrder): Promise<number> {
    const expectedDelivery = new Date(order.order_time);
    expectedDelivery.setDate(expectedDelivery.getDate() + 14);

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO logistic_order (
            shopware_order_id, order_number, customer_id, invoice_amount, payment_id,
            tracking_code, order_status_id,
            warehouse_id, order_time, article_sku, expected_delivery_time, customer_number,
            firstname, lastname, email, street, zipcode, city, phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.shopware_order_id,
          order.order_number,
          order.customer_id,
          order.invoice_amount,
          order.payment_id,
          order.tracking_code,
          order.order_status_id,
          order.warehouse_id,
          order.order_time,
          order.article_sku,
          expectedDelivery.toISOString().slice(0, 19).replace("T", " "),
          order.customer_number,
          order.firstname,
          order.lastname,
          order.email,
          order.street,
          order.zipcode,
          order.city,
          order.phone,
        ]
      );

      const orderId = (result as any).insertId;

      for (const item of order.OrderDetails) {
        await conn.execute(
          `INSERT INTO logistic_order_items (
              order_id, order_number, slmdl_article_id,
              slmdl_articleordernumber, quantity, warehouse_id
            ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            order.order_number,
            item.slmdl_article_id,
            item.slmdl_articleordernumber,
            item.slmdl_quantity,
            item.warehouse_id,
          ]
        );
      }

      console.warn(`Created order ${order.order_number} with ID ${orderId}`);
      return orderId as number;
    } catch (error) {
      await conn.rollback();
      console.error(`Error while creating new Orders.`, error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Get a specific order by order_number with items and drivers information
  static async getOrder(order_number: string): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute(
      `
    SELECT
      lo.*, 
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'driver_id', dd.id,
          'driver_name', dd.name,
          'driver_mobile', dd.mob,
          'driver_address', dd.address,
          'warehouse_id', dd.warehouse_id
        )
      ) AS drivers,
      (
        SELECT GROUP_CONCAT(loi.slmdl_articleordernumber SEPARATOR ', ')
        FROM logistic_order_items loi
        WHERE loi.order_id = lo.order_id
      ) AS article_order_numbers,
      (
        SELECT SUM(loi.quantity)
        FROM logistic_order_items loi
        WHERE loi.order_id = lo.order_id
      ) AS total_quantity
    FROM logistic_order lo
    INNER JOIN driver_details dd 
      ON lo.warehouse_id = dd.warehouse_id
    WHERE lo.order_number = ?
    GROUP BY lo.order_id;
    `,
      [order_number]
    );

    return rows as LogisticOrder[];
  }

  static async getWmsOrderNumbers(): Promise<string[]> {
    const [rows] = await pool.execute(`
      SELECT order_number FROM wms_orders
    `);

    return (rows as any[]).map((row) => row.order_number);
  }

  static async getAllCount(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM logistic_order"
    );
    return rows as LogisticOrder[];
  }

  static async getOrdersLastUpdatedAsync(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM logistic_order WHERE updated_at = (SELECT MAX(updated_at) FROM logistic_order) ORDER BY updated_at DESC LIMIT 1;"
    );
    return rows as LogisticOrder[];
  }

  static async checkOrdersRecentUpdatesAsync(): Promise<CheckOrderCount> {
    // 1️⃣ Query for the latest updated order today and total order count
    const [rows] = await pool.execute<RowDataPacket[]>(
      `
    SELECT 
      (SELECT COUNT(*) FROM logistic_order) AS total_orders,
      lo.updated_at
    FROM logistic_order lo
    WHERE DATE(lo.updated_at) = CURDATE()
    ORDER BY lo.updated_at DESC
    LIMIT 1
    `
    );

    if (rows.length > 0) {
      return {
        count: Number(rows[0].total_orders) || 0,
        lastUpdated: rows[0].updated_at
          ? new Date(rows[0].updated_at).toISOString()
          : undefined,
      };
    }

    // 2️⃣ If no orders updated today, just get the total order count
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_orders FROM logistic_order`
    );

    return {
      count:
        countRows.length > 0 && countRows[0].total_orders
          ? Number(countRows[0].total_orders)
          : 0,
      lastUpdated: undefined,
    };
  }

  static async getAllcustomerAddress(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute("SELECT * FROM `logistic_order`");
    return rows as LogisticOrder[];
  }

  static async getlatlngNullcustomerAddress(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM `logistic_order` WHERE `lattitude` IS NULL AND `longitude` IS NULL"
    );
    return rows as LogisticOrder[];
  }

  static async getOrdersByIds(orderIds: number[]): Promise<Order[]> {
    if (orderIds.length === 0) return [];

    const placeholders = orderIds.map(() => "?").join(", ");
    const [rows] = await pool.execute(
      `SELECT * FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );

    const orders: Order[] = (rows as any).map(mapRowToOrder);
    return orders;
  }

  static async getOrdersWithItemsAsync(orderIds: number[]): Promise<Order[]> {
    if (!orderIds || orderIds.length === 0) {
      logger.warn(`Skipping SQL query - no orderIds provided`);
      return [];
    }
    logger.info(`Executing getOrdersWithItemsAsync with IDs:", ${orderIds}`);

    const placeholders = orderIds.map(() => "?").join(", ");

    const [rows] = await pool.execute(
      ` SELECT 
      o.*,
      wh.warehouse_name, 
      wh.town
    FROM logistic_order o
    JOIN warehouse_details wh
        ON o.warehouse_id = wh.warehouse_id
    WHERE order_id IN (${placeholders})`,
      orderIds
    );

    const orders: Order[] = (rows as any[]).map(mapRowToOrder);

    const [items] = await pool.execute(
      `SELECT * FROM logistic_order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );

    const ordersWithItems = await mapItemsToOrders(
      orders,
      items as OrderItem[]
    );

    return ordersWithItems;
  }

  static async getOrderItemsCount(orderIds: string[]): Promise<number> {
    if (!orderIds || orderIds.length === 0) return 0;

    const placeholders = orderIds.map(() => "?").join(",");
    const query = `SELECT quantity FROM logistic_order_items WHERE order_id IN (${placeholders})`;

    try {
      const [rows] = await pool.execute(query, orderIds);
      const items = rows as { quantity: number }[];

      return items.reduce((acc, item) => acc + item.quantity, 0);
    } catch (error) {
      console.error("Error fetching order items count:", error);
      throw error;
    }
  }

  static async getOrderArticlesCount(orderIds: string[]): Promise<number> {
    if (!orderIds || orderIds.length === 0) return 0;

    const placeholders = orderIds.map(() => "?").join(",");
    const query = `SELECT article_sku FROM logistic_order WHERE order_id IN (${placeholders})`;

    try {
      const [rows] = await pool.execute(query, orderIds);
      const items = rows as { article_sku: string }[];

      const totalCount = items.reduce((acc, row) => {
        if (!row.article_sku) return acc;
        const count = row.article_sku.split(",").filter(Boolean).length;
        return acc + count;
      }, 0);

      return totalCount;
    } catch (error) {
      console.error("Error fetching order items count:", error);
      throw error;
    }
  }

  static async updateSysOrdersStatus(
    conn: PoolConnection,
    orderIds: number[],
    status: OrderStatus
  ): Promise<Boolean> {
    if (!orderIds || orderIds.length === 0) {
      return false;
    }
    if (!status) throw new Error("Invalid order status provided");

    const promises = orderIds.map((oId) =>
      updateOrderStatus({ orderId: oId, newStatus: status, conn })
    );
    await Promise.all(promises);
    return true;
  }

  static async getPendingOrdersAsync(since?: string): Promise<Order[]> {
    let query = `
      SELECT 
          o.*,
          wh.warehouse_name, wh.town
      FROM logistic_order o
      JOIN warehouse_details wh
        ON o.warehouse_id = wh.warehouse_id
      WHERE o.status IN ('initial', 'unassigned', 'rescheduled')
      AND o.warehouse_id IN (1)
  `;
    // AND o.warehouse_id IN (1, 2, 10)

    const params: any[] = [];

    if (since) {
      const sinceDate = new Date(since);
      query += ` AND (o.updated_at > ? OR o.created_at > ?)`;
      params.push(sinceDate, sinceDate);
    }

    query += ` ORDER BY o.order_id`; // LIMIT 300
    // query += ` ORDER BY o.updated_at DESC, o.created_at DESC`;

    const urgency = [331, 181, 264, 210, 256];

    try {
      const [rows] = await pool.execute(query, params);

      const orders: Order[] = (rows as any[]).map((raw: any) => ({
        order_id: raw.order_id,
        order_number: raw.order_number,
        type: raw.type,
        status: raw.status,
        parent_order_id: raw.parent_order_id,

        // payment_id: raw.payment_id,
        order_time: raw.order_time,
        expected_delivery_time: raw.expected_delivery_time,

          warehouse_id: raw.warehouse_id,
          warehouse_name: raw.warehouse_name,
          warehouse_town: raw.town,

          phone: raw.phone,
          street: raw.street,
          city: raw.city,
          zipcode: raw.zipcode,

        location: { lat: +raw.latitude, lng: +raw.longitude },

        created_by: raw.created_by ?? "Unknown",
        created_at: raw.created_at ?? new Date(raw.created_at),
        updated_at: raw.updated_at ?? new Date(raw.created_at),

        items: [],
      }));

      // filter further with WMS orders
      // const [wms_orders] = await pool.execute(
      //   `SELECT order_number FROM wms_orders`
      // );
      // const wmsOrderNumbers = new Set(
      //   (wms_orders as any[]).map((wo) => wo.order_number)
      // );

      // const logisticOrders = orders.filter((o) =>
      //   wmsOrderNumbers.has(o.order_number)
      // );
      // console.log("Filtered Logistic Orders:", logisticOrders);

      return orders;
    } catch (error) {
      console.error("Error fetching pin-b orders:", error);
      throw error;
    }
  }

  static async getPendingOrdersCount(): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM logistic_order WHERE status IN ('initial', 'unassigned', 'rescheduled')`
      );
      return Number(rows[0].count) || 0;
    } catch (error) {
      console.error("Error fetching pending orders count:", error);
      throw error;
    }
  }

  static async pendingOrdersWithWeightAndItems(
    since?: string
  ): Promise<Order[]> {
    const orders: Order[] = await this.getPendingOrdersAsync(since);

    const ordersWithItems = await loadOrderItems(orders as Order[]);

    return ordersWithItems;
  }

  static async updateOrderLocation(order: Order, location: Location) {
    try {
      console.warn(`Order to update location: ${JSON.stringify(order)} `);
      const query = `
      UPDATE logistic_order
      SET latitude = ?, longitude = ?
      WHERE order_id = ?
      `;
      const values = [location.lat, location.lng, order.order_id];

      const [result]: any = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error(`No order found with ID ${order.order_id}`);
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error`);
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  static async getOrderLocationCords(order: Order): Promise<Location | null> {
    try {
      const address = `${order.street}, ${order.city}, ${order.zipcode}`;
      console.log(
        `Calling HERE Map geocode() for Order ${order.order_id} address: ${address} `
      );

      const location: Location = await geocode(address);
      (order.location.lat = location.lat), (order.location.lng = location.lng);
      const isUpdated = await LogisticOrder.updateOrderLocation(
        order,
        location
      );
      if (!isUpdated) {
        console.error(
          `Order ${order.order_id} update failed for Location: ${location}`
        );
        return null;
      }
      return location;
    } catch (error) {
      console.error(`Error`);
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}

export async function get_LogisticsOrdersAddress(orderIds: number[]) {
  const placeholders = orderIds.map(() => "?").join(",");
  const [orderRows] = await pool.execute(
    `SELECT order_id, order_number, street, city, zipcode FROM logistic_order WHERE order_id IN (${placeholders})`,
    orderIds
  );
  // console.log("Orders Addresses:", orderRows);

  return orderRows;
}
