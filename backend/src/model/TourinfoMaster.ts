import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { Tour } from "../types/tour.types";
import { DynamicTourPayload} from "../types/dto.types";
import { LogisticOrder } from "../model/LogisticOrders";
import {
  getTourMatrix,
} from "../services/tour.service";



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
  ): Promise<number> {
    // console.log(
    //   "-------------------------------- STEP 5 UPDATING HERE MAP RESPONSE ----------------------------------------------------"
    // );

    await conn.execute(
      `UPDATE tourinfo_master SET tour_data = ?, tour_route = ? WHERE id = ?`,
      [tour_data, tour_route, tourId]
    );

    return tourId;
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
  // static async getRouteResponse(_tourId: number): Promise<any> {
  //   // Run the SQL query to get the graphhopper_route for the given tour_id
  //   const [rows] = await pool.execute(
  //     `SELECT * FROM tourinfo_master WHERE id = ?`,
  //     [_tourId]
  //   );
  //   // TypeScript type assertion to ensure we're dealing with RowDataPacket[]
  //   if (Array.isArray(rows) && rows.length > 0) {
  //     const row = rows[0] as { tour_route: JSON }; // Explicitly assert the correct type
  //     return row; // Return the heremap_route field
  //   } else {
  //     throw new Error("Tour not found.");
  //   }
  // }
  // export async function getDynamicToursAsync()
   static async getRouteResponse(_tourId: number): Promise<
    DynamicTourPayload[]
  > {
    const query = `
    SELECT tim.*,tim.order_ids AS orderIds, wh.warehouse_name, wh.color_code AS warehouse_colorCode
    FROM tourinfo_master AS tim
    JOIN warehouse_details AS wh 
      ON tim.warehouse_id = wh.warehouse_id
    WHERE tim.id =${_tourId}`;

    try {
      const [rows] = await pool.execute(query);

      const sTours: DynamicTourPayload[] = (rows as DynamicTourPayload[]).map(
        (row) => ({
          id: row.id,
          tour_name: row.tour_name,
          tour_route:
            typeof row.tour_route === "string"
              ? JSON.parse(row.tour_route)
              : row.tour_route,
          orderIds: row.orderIds.replace(/[\[\]\s]/g, ''),
          totalOrdersItemsQty: 0,
          warehouse_id: row.warehouse_id,
          warehouse_name: row.warehouse_name,
          warehouse_colorCode: row.warehouse_colorCode,
          created_at: row.created_at,
          updated_at: row.updated_at,
          updated_by: row.updated_by,
        })
      );

      for (const tour of sTours) {
        const order_ids = tour.orderIds.split(",");
        tour.totalOrdersItemsQty = await LogisticOrder.getOrderItemsCount(
          order_ids
        );
        const tourMatrix = await getTourMatrix(tour.id!);
        console.log(`tourMatrix for sTour Id: ${tour.id}: ${tourMatrix}`);
        tour.matrix = tourMatrix;
      }
      // console.warn(`sTours with Matrix`, sTours);

      return sTours;
    } catch (error) {
      console.error("Error fetching tours details:", error);
      throw error;
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

