import { ResultSetHeader } from "mysql2";
import pool from "../database";
import { CheckOrderCount, pinboardOrder } from "../types/dto.types";

export enum OrderStatus {
  initial = "initial",
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
  public customer_id!: string;
  public invoice_amount!: string;
  public payment_id!: number;
  public order_time!: Date;
  public expected_delivery_time!: Date;
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
  public lattitude!: number | null;
  public longitude!: number | null;
  public created_at!: Date;
  public updated_at!: Date | null;
  public status: OrderStatus = OrderStatus.initial;

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

  static async getOrder(order_number: string): Promise<any[]> {
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
      [order_number] // ✅ Provide the value for the placeholder
    );

    return rows as any[];
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
    const [rows]: any = await pool.execute(`
    SELECT 
      (SELECT COUNT(*) FROM logistic_order) AS total_orders,
      lo.*
    FROM logistic_order lo
    where DATE(lo.updated_at) = CURDATE()
    ORDER BY lo.updated_at DESC
    LIMIT 1
  `);

    const result = rows[0];
    console.log("Order Count Result: ", result);

    const orderCount: CheckOrderCount = {
      count: result.total_orders,
      lastUpdated: result.updated_at,
    };

    console.log("Order Count: ", orderCount);
    return orderCount;
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
    orderIds: number[],
    status: OrderStatus
  ): Promise<Boolean> {
    if (!status) throw new Error("Invalis order status provided");

    const placeholders = orderIds.map(() => "?").join(", ");
    const [result] = await pool.execute(
      `UPDATE logistic_order SET status = ?, updated_at = NOW() WHERE order_id IN (${placeholders})`,
      [status, ...orderIds]
    );

    return (result as ResultSetHeader).affectedRows > 0;
  }

  static async getPinboardOrdersAsync(): Promise<pinboardOrder[]> {
    const [rows] = await pool.execute(`
      SELECT 
        order_id , order_number, order_time, expected_delivery_time, invoice_amount,
        city, zipcode, street, lattitude, longitude, warehouse_id
      FROM logistic_order
      WHERE status IN ('initial', 'unassigned')
      ORDER BY updated_at DESC, created_at DESC;
    `);
    const orders = (rows as any[]).map((raw: any) => ({
      id: raw.order_id,
      order_number: raw.order_number,
      order_time: raw.order_time,
      delivery_time: raw.expected_delivery_time,
      amount: raw.invoice_amount,
      city: raw.city,
      zipcode: raw.zipcode,
      street: raw.street,
      location: {
        lat: raw.lattitude || null,
        lng: raw.longitude || null,
      },
      warehouse_id: raw.warehouse_id,
    })) as pinboardOrder[];

    return orders;
  }
}

export async function get_LogisticsOrdersAddress(orderIds: number[]) {
  const placeholders = orderIds.map(() => "?").join(",");
  const [orderRows] = await pool.query(
    `SELECT order_id, street, city, zipcode FROM logistic_order WHERE order_id IN (${placeholders})`,
    orderIds
  );
  return orderRows;
}
