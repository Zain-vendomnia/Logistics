import pool from "../database";

interface DynamicTourPayload {
  id?: number;
  tour_number: string;
  tour_route: object;
  orderIds: string; // Comma-separated
  warehouse_id: number;
  approved_by?: string;
  approved_at?: string;
}

function generateTourNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `TOUR-${datePart}-${randomPart}`;
}

export async function createDynamicTourAsync(
  tourData: Omit<DynamicTourPayload, "tour_number">
) {
  console.log("Creating dynamic tour with data:", tourData);
  if (
    !tourData ||
    !tourData.tour_route ||
    !tourData.orderIds ||
    !tourData.warehouse_id
  ) {
    throw new Error(
      "Missing required tour data. Operation cannot be performed."
    );
  }

  const tour_number = generateTourNumber(); // unique number for each tour

  const {
    tour_route,
    orderIds,
    warehouse_id,
    approved_by = null,
    approved_at = null,
  } = tourData;

  const query = `
    INSERT INTO dynamic_tours (
      tour_number, tour_route, orderIds, warehouse_id, approved_by, approved_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    tour_number,
    JSON.stringify(tour_route), // JSON storage
    orderIds,
    warehouse_id,
    approved_by,
    approved_at,
  ];

  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    console.error("Error inserting dynamic tour:", error);
    throw error;
  }
}

// export async function getDynamicToursAsync()
export async function getUnapprovedDynamicTours(): Promise<
  Pick<
    DynamicTourPayload,
    "id" | "tour_number" | "tour_route" | "orderIds" | "warehouse_id"
  >[]
> {
  const query =
    "SELECT id, tour_number, tour_route, orderIds, warehouse_id FROM dynamic_tours WHERE approved_at IS NULL";

  try {
    const [rows] = await pool.execute(query);

    return (rows as any[]).map((row) => ({
      id: row.id,
      tour_number: row.tour_number,
      tour_route:
        typeof row.tour_route === "string"
          ? JSON.parse(row.tour_route)
          : row.tour_route,
      orderIds: row.orderIds,
      warehouse_id: row.warehouse_id,
    }));
  } catch (error) {
    console.error("Error fetching unapproved dynamic tours:", error);
    throw error;
  }
}
