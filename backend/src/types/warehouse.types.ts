export type WarehouseZipcodes = {
  warehouse_id: number;
  name: string;
  town: string;
  zip_codes_delivering: number[];
};

export type Vehicle = {
  id: number;
  capacity: number;
  license_plate: string;
  driver_id: number;

  miles_driven?: number;
  next_service: Date;

  created_at?: string;
  updated_at?: string;
};

export type Warehouse = {
  id: number;
  name?: string;
  town: string;
  zip_code?: string;
  address?: string;
  lat: number;
  lng: number;
  zip_codes_delivering: string;
  color_code: string;
  email?: string;
  clerk_name?: string;
  // clerkName?: string;
  clerk_mob?: number;
  // clerkMob?: number;
  is_active?: boolean;
  vehicles?: Vehicle[];
  // grossWeightKg?: number;
  loadingWeightKg?: number;
  capacityPerVehicle?: number;

  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type Driver = {
  id: number;
  name: string;
  overall_rating?: number;

  mob?: string;
  email?: string;
  address?: string;

  warehouse_id?: number;
  user_id?: string;

  created_at?: string;
  updated_at?: string;
};
