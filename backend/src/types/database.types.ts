export interface LogisticOrder {
  order_id: number;
  street: string;
  city: string;
  zipcode: string;
}
export interface LogisticOrderItem {
  id: number;
  order_id: number;
  order_number: string;
  slmdl_article_id: string;
  slmdl_articleordernumber: string;
  quantity: number;
  warehouse_id: string;
}

export interface WarehouseDetails {
  id: number;
  name: string;
  address: string;
  vehicleCount: number;
  capacityPerVehicle: number;
}
