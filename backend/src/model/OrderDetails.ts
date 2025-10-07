import pool from "../config/database";

export class OrderDetails {
  public id!: number;
  public customerName!: string;
  public address!: string;
  public mobileNumber!: string;
  public orderNumber!: string;
  public itemName!: string;
  public quantity!: number;

  // Method to get all orders (specifically addresses) from the database
  static async getAllOrders(): Promise<OrderDetails[]> {
    const [rows] = await pool.execute("SELECT * FROM  `orderdata`");
    return rows as OrderDetails[];
  }

  static async getAllcustomerAddress(): Promise<OrderDetails[]> {
    const [rows] = await pool.execute("SELECT * FROM  `orderdetails`");
    return rows as OrderDetails[];
  }
}
