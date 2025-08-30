// export type Warehouse = {
//   address: string;
//   clerk_mob: string;
//   clerk_name: string;

//   created_at: string;
//   email: string;
//   updated_at: string;
//   warehouse_id: string;
//   warehouse_name: string;
// };

export interface WarehouseDetails {
  id: number;
  name?: string;
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
}

export interface Driver {
  id: number;
  name: string;
  warehouse_id?: number;
  status: number;

  address: string;
  mob: string;
  email: string;
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
