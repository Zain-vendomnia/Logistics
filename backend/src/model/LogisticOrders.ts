import pool from '../database';

export class LogisticOrder  {
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

    return (rows as any[]).map(row => row.order_number);
  }
  
  static async getAllCount(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM logistic_order');
    return rows as LogisticOrder[];
  }

  static async getAllcustomerAddress(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute('SELECT * FROM `logistic_order`');  
    return rows as LogisticOrder[];
  }

  static async getlatlngNullcustomerAddress(): Promise<LogisticOrder[]> {
    const [rows] = await pool.execute('SELECT * FROM `logistic_order` WHERE `lattitude` IS NULL AND `longitude` IS NULL');  
    return rows as LogisticOrder[];
  }

  static async getOrdersByIds(orderIds: number[]): Promise<LogisticOrder[]> {
    if (orderIds.length === 0) return [];
  
    const placeholders = orderIds.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT * FROM logistic_order WHERE order_id IN (${placeholders})`,
      orderIds
    );
  
    return rows as LogisticOrder[];
  }
}
