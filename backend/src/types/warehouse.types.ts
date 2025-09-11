export type WarehouseZipcodes = {
  warehouse_id: number;
  name: string;
  town: string;
  zip_codes_delivering: number[];
};

export type WarehouseVehicle = {
  vehicle_id: number;
  capacity: number;
  license_plate: string;
  driver_id: number;
};

export interface Warehouse {
  id: number;
  warehouse_name?: string;
  name?: string;
  clerk_name?: string;
  clerkName?: string;
  clerk_mob?: number;
  clerkMob?: number;
  address?: string;
  zipcode?: string;
  lat?: number;
  lng?: number;
  town?: string;
  colorCode?: string;
  zip_codes_delivering?: string;
  email?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  vehicles?: WarehouseVehicle[];
}
