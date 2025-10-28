import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import { CheckOrderCount } from "../types/dto.types";
import { Order, OrderDetails, OrderItem } from "../types/order.types";
import { PoolConnection } from "mysql2/promise";
import { geocode } from "../services/hereMap.service";
import { Location } from "../types/hereMap.types";

export enum OrderStatus {
  initial = "initial",
  inProcess = "inProcess",
  unassigned = "unassigned",
  assigned = "assigned",
  inTransit = "inTransit",
  delivered = "delivered",
  rescheduled = "rescheduled",
  canceled = "canceled",
}

export class LogisticOrder {
  public order_id!: number;
  public order_number!: string;
  public shopware_order_id!: number | string;
  public customer_id!: string;
  public tracking_code!: string;
  public order_status_id!: number;

  public invoice_amount!: string;
  public payment_id!: number;
  public order_time!: Date;
  public article_sku!: string;
  public expected_delivery_time?: Date;
  public warehouse_id!: number;
  public quantity!: number;
  public article_order_number!: string;
  public customer_number!: string;
  public firstname!: string;
  public lastname!: string;
  public email!: string;
  public street!: string;
  public zipcode!: string;
  public city!: string;
  public phone!: string;
  public lattitude: number | null = null;
  public longitude: number | null = null;
  public created_at?: Date;
  public updated_at?: Date | null;
  public status?: OrderStatus = OrderStatus.initial;
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

  static async getOrdersByIds(orderIds: number[]): Promise<LogisticOrder[]> {
    if (orderIds.length === 0) return [];

    const placeholders = orderIds.map(() => "?").join(", ");
    const [rows] = await pool.execute(
      `SELECT * FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );

    return rows as LogisticOrder[];
  }

  static async getOrdersWithItemsAsync(orderIds: number[]): Promise<Order[]> {
    if (orderIds.length === 0) return [];

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

    const orders: Order[] = (rows as any[]).map((raw: any) => ({
      order_id: raw.order_id,
      order_number: raw.order_number,
      status: raw.status,

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
      items: [],
    }));

    const [items] = await pool.execute(
      `SELECT * FROM logistic_order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );

    ////

    const ordersWithItems = await LogisticOrder.mapOrdersItems(
      orders,
      items as OrderItem[]
    );

    return ordersWithItems;

    // const orderWithItems = (orders as any[]).map((order) => ({
    //   ...order,

    //   items: (items as any[])
    //     .filter((item) => item.order_id === order.order_id)
    //     .map((item) => ({
    //       id: item.id,
    //       order_id: item.order_id,
    //       order_number: item.order_number,
    //       quantity: item.quantity,
    //       article: item.slmdl_articleordernumber.split("-")[0],
    //       // article_id: item.slmdl_article_id,
    //       // warehouse_id: item.warehouse_id,
    //     })),
    // }));

    // return orderWithItems as Order[];
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

  static async getOrdersByStatus(
    status: OrderStatus
  ): Promise<LogisticOrder[]> {
    if (!status) return [];

    const [rows] = await pool.execute(
      `SELECT * FROM logistic_order WHERE status = ?`,
      status
    );

    return rows as LogisticOrder[];
  }

  static async updateOrdersStatus(
    conn: PoolConnection,
    orderIds: number[],
    status: OrderStatus
  ): Promise<Boolean> {
    if (!orderIds || orderIds.length === 0) {
      return false;
    }
    if (!status) throw new Error("Invalid order status provided");

    const placeholders = orderIds.map(() => "?").join(", ");
    const [result] = await conn.execute(
      `UPDATE logistic_order SET status = ?, updated_at = NOW() WHERE order_id IN (${placeholders})`,
      [status, ...orderIds]
    );

    return (result as ResultSetHeader).affectedRows > 0;
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

    try {
      const [rows] = await pool.execute(query, params);

      const orders: Order[] = (rows as any[]).map((raw: any) => ({
        order_id: raw.order_id,
        order_number: raw.order_number,
        status: raw.status,

        payment_id: raw.payment_id,

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
        items: [],
      }));

      console.log(`***************** ${orders.length} fetched orders`);

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

    const placeholders = orders.map(() => "?").join(",");
    const [items] = await pool.execute(
      `SELECT * FROM logistic_order_items WHERE order_id IN (${placeholders})`,
      orders.map((o) => o.order_id)
    );

    const ordersWithItems = await LogisticOrder.mapOrdersItems(
      orders as Order[],
      items as OrderItem[]
    );

    return ordersWithItems;
  }

  static async mapOrdersItems(orders: Order[], items: OrderItem[]) {
    const [solarModules] = await pool.execute(
      `SELECT * from solarmodules_items`
    );

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
          .map((item) => ({
            id: item.id,
            order_id: item.order_id,
            order_number: item.order_number,
            quantity: item.quantity,
            article: item.slmdl_articleordernumber.split("-")[0],
            // article_id: item.slmdl_article_id,
            // warehouse_id: item.warehouse_id,
          })),
      };
    });

    return orderWithItems;
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
  console.log("Orders Addresses:", orderRows);

  return orderRows;
}
