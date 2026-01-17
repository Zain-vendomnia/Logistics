import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { TourinfoMaster } from "../types/tour.types";
import { mapRowToTour } from "../helpers/tour.helper";

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
    tour_data: string,
    tour_route: string
  ): Promise<void> {
    // console.log(
    //   "-------------------------------- STEP 5 UPDATING HERE MAP RESPONSE ----------------------------------------------------"
    // );

    await conn.execute(
      `UPDATE tourinfo_master SET tour_data = ?, tour_route = ? WHERE id = ?`,
      [tour_data, tour_route, tourId]
    );
    // console.log(
    //   "-------------------------------------------------------------------------------------------------------------------"
    // );
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
      `SELECT heremap_route FROM tourinfo_master WHERE id = ?`,
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

  static async getTourByIdAsync(tourId: number): Promise<TourinfoMaster> {
    try {
      const [rows]: any = await pool.execute(
        `SELECT 
          t.*,
          w.warehouse_id        AS warehouse_id,
          w.warehouse_name                AS warehouse_name,
          w.address             AS warehouse_address,
          w.town                AS warehouse_town,
          w.color_code           AS warehouse_colorCode,
          w.zip_codes_delivering AS warehouse_zip_codes_delivering,
          w.zip_code           AS warehouse_zip_code,

          v.vehicle_id           AS vehicle_id,
          v.license_plate         AS vehicle_license_plate,
          v.capacity                 AS vehicle_capacity,

          d.id                   AS driver_id,
          d.name                 AS driver_name,
          d.mob                AS driver_phone

        FROM tourinfo_master AS t
        JOIN warehouse_details AS w 
          ON t.warehouse_id = w.warehouse_id
        JOIN driver_details AS d
          ON t.driver_id = d.id
        JOIN vehicle_details AS v
          ON t.warehouse_id = v.warehouse_id 
        AND t.driver_id = v.driver_id
        WHERE t.id = ?
        `,
        [tourId]
      );

      const tourinfo: TourinfoMaster = mapRowToTour(rows[0] as any);
      return tourinfo;
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
