<<<<<<< HEAD
import pool from '../database';

export class route_segments {
    
    public id!: number;
    public tour_id!: number;
    public status!: string;
    public comments!: string;
    public route_response!:JSON;
    public delivered_item_pic!: Blob;
    public customer_signature!: Blob;
    public created_at!:  Date;
    public updated_at!:  Date | null;

    static async getAllToursCount(): Promise<route_segments[]>{
        const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM route_segments');
        return rows as route_segments[];
    }

    static async insertSegment(_insertedTourId: number, segmentJson: string, order_id: string): Promise<void> {
       // console.log("order_id:", order_id);
        await pool.execute(
          `INSERT INTO route_segments (tour_id, route_response, order_id) VALUES (?, ?, ?)`,
          [_insertedTourId, segmentJson, order_id]
        );
      }
    static async getRoutesegmentRes(_tourId: number): Promise<any> {
        // Run the SQL query to get the graphhopper_route for the given tour_id
        const [rows] = await pool.execute(
            `SELECT route_response FROM route_segments WHERE tour_id = ?`,
            [_tourId]
        );
        // TypeScript type assertion to ensure we're dealing with RowDataPacket[]
        if (Array.isArray(rows) && rows.length > 0) {
            const row = rows[0] as { route_response: JSON }; // Explicitly assert the correct type
            return row.route_response; // Return the graphhopper_route field
        } else {
            throw new Error('Tour not found.');
        }
    }
}
=======
import pool from "../database";

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
    _insertedTourId: number,
    segmentJson: string,
    order_id: string
  ): Promise<void> {
    // console.log("order_id:", order_id);
    await pool.execute(
      `INSERT INTO route_segments (tour_id, route_response, order_id) VALUES (?, ?, ?)`,
      [_insertedTourId, segmentJson, order_id]
    );
  }
  static async getRoutesegmentRes(_tourId: number): Promise<any> {
    // Run the SQL query to get the graphhopper_route for the given tour_id
    const [rows] = await pool.execute(
      `SELECT route_response FROM route_segments WHERE tour_id = ?`,
      [_tourId]
    );
    // TypeScript type assertion to ensure we're dealing with RowDataPacket[]
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as { route_response: JSON }; // Explicitly assert the correct type
      return row.route_response; // Return the graphhopper_route field
    } else {
      throw new Error("Tour not found.");
    }
  }
}
>>>>>>> recovered-admin-branch
