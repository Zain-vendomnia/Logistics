export type WarehouseCreate_Req = {
  name: string;
  town: string;
  address: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  loadingWeight: number;
  clerkName: string;
  clerkMob: string;
  email: string;
  is_active: boolean;
};

export interface Warehouse {
  id: number;
  name: string;
  town: string;
  address?: string;
  zipcode?: string;
  zip_codes_delivering?: string;
  colorCode?: string;

  email?: string;
  clerkName?: string;
  clerkMob?: string;

  created_at?: string;
  updated_at?: string;
  updated_by?: string;

  vehicleCount?: number;
  capacityPerVehicle?: number;

  is_active: boolean;
  vehicle_license_plates?: string[];
}

export type Vehicle = {
  vehicle_id: number;
  capacity: number;
  license_plate: string;
  driver_id: number;

  miles_driven?: number;
  next_service: Date;

  created_at?: string;
  updated_at?: string;
};

export interface Driver {
  id: number;
  name: string;
  overall_rating?: number;

  warehouse_id?: number;
  status: number;

  address: string;
  mob: string;
  email: string;

  created_at?: string;
  updated_at?: string;
}

// export type Order = {
//   order_id: number;
//   order_number: string;
//   customer_id: string;
//   invoice_amount: string;
//   payment_id: number;
//   order_time: Date;
//   expected_delivery_time: Date;
//   warehouse_id: number;
//   quantity: number;
//   article_order_number: string;
//   customer_number: string;
//   firstname: string;
//   lastname: string;
//   email: string;
//   phone: string;
//   street: string;
//   city: string;
//   zipcode: string;
//   lattitude: number | null;
//   longitude: number | null;
//   created_at: Date;
//   items: OrderItem[];
// };

// export type OrderItem = {
//   id: string;
//   order_id: number;
//   order_number: string;
//   quantity: number;
//   article_id: string;
//   article: string;
//   warehouse_id: string;
// };
