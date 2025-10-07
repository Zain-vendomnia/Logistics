import pool from "../config/database";

interface FilterParams {
  status: string;
  search: string;
  page: number;
  limit: number;
}

export const getFilteredToursService = async ({
  status,
  search,
  page,
  limit,
}: FilterParams) => {
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (status !== "all") {
    whereClause += " AND tour_status = ?";
    params.push(status);
  }

  if (search) {
    whereClause += " AND id LIKE ?";
    params.push(`%${search}%`);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT 
    id, tour_name, driver_id, tour_date, warehouse_id,
    start_time, end_time, item_total_qty_truck, tour_status,
    route_color, created_at
  FROM tourInfo_master
  ${whereClause}
  ORDER BY id DESC
  LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows]: any = await connection.query(
      `SELECT COUNT(*) as total FROM tourInfo_master ${whereClause}`,
      params
    );

    await connection.commit();

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error during getFilteredToursService:", error);
    throw error;
  } finally {
    connection.release();
  }
};
