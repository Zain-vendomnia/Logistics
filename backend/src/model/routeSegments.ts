import { PoolConnection } from "mysql2/promise";
import pool from "../database";
import { LogisticsRoute } from "../types/tour.types";

export class route_segments {
  public id!: number;
  public tour_id!: number;
  public status!: string;
  public comments!: string;
  public route_response!: JSON;
  public delivered_item_pic!: Blob;
  public customer_signature!: Blob;
  public created_at!: Date;
  public updated_at!: Date | null;

  static async getAllToursCount(): Promise<route_segments[]> {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM route_segments"
    );
    return rows as route_segments[];
  }

  static async insertSegment(
    conn: PoolConnection,
    _insertedTourId: number,
    segmentJson: string,
    order_id: string
  ): Promise<void> {
    // console.log("order_id:", order_id);
    await conn.execute(
      `INSERT INTO route_segments (tour_id, route_response, order_id) VALUES (?, ?, ?)`,
      [_insertedTourId, segmentJson, order_id]
    );
  }
  
  static async getRoutesegmentRes(_tourId: number): Promise<any> {
    // Run the SQL query to get the graphhopper_route for the given tour_id
    const [rows] = await pool.execute(
      `SELECT * FROM route_segments WHERE tour_id = ? ORDER BY created_at ASC`,
      [_tourId]
    );
    // TypeScript type assertion to ensure we're dealing with RowDataPacket[]
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;

      // const row = rows[0] as { route_response: JSON }; // Explicitly assert the correct type
      // return row.route_response; // Return the graphhopper_route field
    } else {
      throw new Error("Tour not found.");
    }
  }

  static async getAllRouteSegments_TourId(
    _tourId: number
  ): Promise<LogisticsRoute[]> {
    const [rows] = await pool.execute(
      `SELECT route_response FROM route_segments WHERE tour_id = ? ORDER BY created_at ASC`,
      [_tourId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      throw new Error("No route segments found for this tour.");
    }

    const routeSegments = (rows as any[]).map((res) => res.route_response);
    return routeSegments as LogisticsRoute[];
  }


  static async getRoutesegmentImagesRes(_tourId?: number, _orderNumber?: string): Promise<any> {
    // Ensure at least one of the parameters is provided
    if (_tourId === undefined && _orderNumber === undefined) {
      throw new Error("At least one of tour_id or order_id must be provided.");
    }


    // Build dynamic SQL
    let query = `SELECT * FROM order_images`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (_tourId !== undefined) {
      conditions.push(`tour_id = ?`);
      params.push(_tourId);
    }

    if (_orderNumber !== undefined) {
      conditions.push(`order_number = ?`);
      params.push(_orderNumber);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at ASC`;

    const [rows] = await pool.execute(query, params);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    } else {
      throw new Error("No images found for the provided criteria.");
    }
  }

}

