import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { Tour } from "../types/tour.types";

export class tourInfo_master {
  public id!: number;
  public tour_name!: string;
  public driver_id!: number;
  public tour_date!: Date;
  public warehouse_id!: number;
  public start_time!: Date;
  public end_time!: Date;

  public order_ids!: JSON;
  public comments!: string;
  public customer_ids!: string;
  public item_total_qty_truck!: number;
  public truck_loaded_img!: Blob;
  public tour_end_truck_qty_pic!: Blob;
  public tour_end_fuel_pic!: Blob;

  public tour_start_km!: number;
  public tour_end_km!: number;
  public excepted_tour_total_km!: number;
  public tour_start_fuel_pic!: Blob;
  public route_color!: string;
  public graphhopper_route!: JSON;
  public created_at!: Date;
  public updated_at!: Date | null;
  public tour_status!: string;

  static async getAllToursCount(): Promise<tourInfo_master[]> {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM tourinfo_master;"
    );
    return rows as tourInfo_master[];
  }
  static async updateHereMapResponse(
    conn: PoolConnection,
    tourId: number,
    jsonData: string
  ): Promise<void> {
    console.log(
      "-------------------------------- STEP 5 UPDATING HERE MAP RESPONSE ----------------------------------------------------"
    );

    await conn.execute(
      `UPDATE tourinfo_master SET heremap_route = ? WHERE id = ?`,
      [jsonData, tourId]
    );
    console.log(
      "-------------------------------------------------------------------------------------------------------------------"
    );
  }

  static async updateGraphhopperResponse(
    tourId: number,
    jsonData: string
  ): Promise<void> {
    await pool.execute(
      `UPDATE tourinfo_master SET graphhopper_route = ? WHERE id = ?`,
      [jsonData, tourId]
    );
  }
  static async getRouteResponse(_tourId: number): Promise<any> {
    // Run the SQL query to get the graphhopper_route for the given tour_id
    const [rows] = await pool.execute(
      `SELECT * FROM tourinfo_master WHERE id = ?`,
      [_tourId]
    );
    // TypeScript type assertion to ensure we're dealing with RowDataPacket[]
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as { heremap_route: JSON }; // Explicitly assert the correct type
      return row.heremap_route; // Return the heremap_route field
    } else {
      throw new Error("Tour not found.");
    }
  }
  static async getAllTourstatus(): Promise<any> {
    try {
      const [rows]: any = await pool.execute(
        `SELECT id FROM tourinfo_master WHERE tour_status = 'completed'`
      );

      return rows; // rows will be an array of objects like [{id: 1}, {id: 2}, ...]
    } catch (error) {
      console.error("Error fetching completed tour IDs:", error);
      throw error;
    }
  }

  static async getTourByIdAsync(tourId: number): Promise<Tour> {
    try {
      const [rows]: any = await pool.execute(
        `SELECT * FROM tourinfo_master WHERE id = ?`,
        [tourId]
      );

      return rows[0] as Tour;
    } catch (error) {
      console.error("Error fetching tour ID:", error);
      throw error;
    }
  }
  static async getTourNameByIdAsync(tourId: number) {
    try {
      const [rows]: any = await pool.execute(
        `SELECT tour_name FROM tourinfo_master WHERE id = ?`,
        [tourId]
      );

      return rows[0];
    } catch (error) {
      console.error("Error fetching tour ID:", error);
      throw error;
    }
  }
}
