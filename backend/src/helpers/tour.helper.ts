import {
  get_LogisticsOrdersAddress,
  LogisticOrder,
} from "../model/LogisticOrders";
import { TourinfoMaster } from "../types/tour.types";
import { Driver, Vehicle, Warehouse } from "../types/warehouse.types";

export async function generateTourName(orderIds: number[]): Promise<string> {
  const orders = (await get_LogisticsOrdersAddress(
    orderIds
  )) as LogisticOrder[];

  const zipcodePrefixes = Array.from(
    new Set(orders.map((o) => o.zipcode?.substring(0, 2) || "00"))
  );

  const zipcodeString = zipcodePrefixes.join("-");
  return `PLZ-${zipcodeString}`;
}

export function mapRowToTour(row: any): TourinfoMaster {
  return {
    id: row.id,
    tour_name: row.tour_name,
    tour_status: row.tour_status,
    tour_date: row.tour_date,
    start_time: row.start_time,
    end_time: row.end_time,
    tour_route: row.tour_route,
    route_color: row.route_color,
    orderIds: row.order_ids,

    item_total_qty_truck: row.item_total_qty_truck,

    comments: row.comments,
    customer_ids: row.customer_ids,

    truck_loaded_img: row.truck_loaded_img,
    tour_end_truck_qty_pic: row.tour_end_truck_qty_pic,
    tour_end_fuel_pic: row.tour_end_fuel_pic,

    tour_start_km: row.tour_start_km,
    tour_end_km: row.tour_end_km,
    excepted_tour_total_km: row.excepted_tour_total_km,
    tour_start_fuel_pic: row.tour_start_fuel_pic,

    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by: row.updated_by,

    warehouse_id: row.warehouse_id,
    warehouse_name: row.warehouse_name || "N/A",
    warehouse_address: row.warehouse_address || "N/A",
    warehouse_town: row.warehouse_town || "N/A",
    warehouse_colorCode: row.warehouse_colorCode || "N/A",
    warehouse_zip_codes_delivering: row.warehouse_zip_codes_delivering || "N/A",
    warehouse_zip_code: row.warehouse_zip_code || "N/A",

    driver_id: row.driver_id || 0,
    driver_name: row.driver_name || "N/A",
    driver_phone: row.driver_phone || "N/A",

    vehicle_id: row.vehicle_id || "N/A",
    vehicle_name: row.vehicle_name || "N/A",
    vehicle_registration: row.vehicle_license_plate || "N/A",
    vehicle_capacity: row.vehicle_capacity || "N/A",
  };
}

export function mapRowToWarehouse(row: any): Warehouse {
  return {
    id: row.warehouse_id,
    name: row.warehouse_name,

    town: row.warehouse_town,
    address: row.address,
    lat: row.lat,
    lng: row.lng,

    loadingWeightKg: row.loading_Weight_Kg,
    capacityPerVehicle: row.loading_Weight_Kg,

    zip_code: row.zip_code,
    zip_codes_delivering: row.zip_codes_delivering,
    color_code: row.color_code,

    email: row.email,
    clerk_name: row.clerk_name,
    clerk_mob: row.clerk_mob,
    is_active: row.is_active,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapRowToDriver(row: any): Driver {
  return {
    id: row.id,
    name: row.driver_name,
    overall_rating: row.overall_rating,

    mob: row.driver_mob,
    email: row.driver_email,
    address: row.address,

    // license_number: row.license_number,
    // license_expiry: row.license_expiry,
    warehouse_id: row.warehouse_id,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapRowToVehicle(row: any): Vehicle {
  return {
    id: row.vehicle_id,
    capacity: row.capacity,
    license_plate: row.license_plate,
    driver_id: row.driver_id,
    miles_driven: row.miles_driven,
    next_service: row.next_service,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
