import pool from '../database';

export class tourInfo_master{
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
    public tour_total_km!: number;
    public tour_start_fuel_pic!: Blob;
    public route_color!: string;
    public created_at!:  Date;
    public 	updated_at!:  Date | null;

    static async getAllToursCount(): Promise<tourInfo_master[]>{
        const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM tourinfo_master');
        return rows as tourInfo_master[];
      }
}

