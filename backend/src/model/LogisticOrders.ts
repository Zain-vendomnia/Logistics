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
 
  // Get all logistic orders
  static async getAll(): Promise<any[]> {
   
    const [rows] = await pool.execute(`
      SELECT 
        lo.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'driver_id', dd.id,
            'driver_name', dd.name,
            'driver_mobile', dd.mob,
            'driver_address', dd.address
          )
        ) AS drivers
      FROM logistic_order lo
      INNER JOIN driver_details dd 
        ON lo.warehouse_id = dd.warehouse_id
      GROUP BY lo.warehouse_id, lo.order_id
    `);
    return rows as any[];
  }
 
  static async getAllCount(): Promise<LogisticOrder[]>{
    
    const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM logistic_order');
    return rows as LogisticOrder[];
  }

  static async getAllcustomerAddress(): Promise<LogisticOrder[]> {
   
    const [rows] = await pool.execute('SELECT * FROM  `logistic_order`');  
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
