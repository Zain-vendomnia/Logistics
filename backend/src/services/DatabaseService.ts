import { ResultSetHeader } from "mysql2";
import pool from "../database";
import { CreateTour } from "../types/dto.types";

export async function newTourInfoMaster(tour: CreateTour) {
  const propPlaceholders = Object.keys(tour)
    .map(() => "?")
    .join(",");
  const {
    tourDate,
    startTime,
    orderIds,
    driverId,
    warehouseId,
    comments,
    routeColor,
  } = tour;

  const [result] = (await pool.query(
    `
    INSERT INTO tourinfo_master(
        tour_date,
        start_time, 
        order_ids, 
        driver_id,
        warehouse_id,
        comments,
        route_color,
        created_at, 
        updated_at
    )
        VALUES (${propPlaceholders}, NOW(), NOW())
    `,
    [
      tourDate,
      startTime,
      JSON.stringify(orderIds),
      driverId,
      warehouseId,
      comments ?? "",
      routeColor,
    ]
  )) as ResultSetHeader[];
  return result.insertId;
}
