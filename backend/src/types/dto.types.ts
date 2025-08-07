export type CreateTour = {
  tourDate: string;
  startTime: string;
  comments: string | null;
  routeColor: string;
  orderIds: number[];
  driverId: number;
  warehouseId: number;
};

export interface WarehouseDetails {
  id: number;
  name: string;
  address: string;
  vehicleCount: number;
  capacityPerVehicle: number;
}

export type NotAssigned = {
  id: string;
  orderNumber: string | null;
  reason: {
    code: string;
    description: string;
  }[];
};

export type CheckOrderCount = {
  count: number;
  lastUpdated: string;
};

export type pinboardOrder = {
  id: number;
  order_number: string;

  order_time: string;
  delivery_time: string;
  amount: number;

  city: string;
  zipcode: string;
  street: string;
  
  location: { lat: number; lng: number };
  warehouse_id: number;
};
