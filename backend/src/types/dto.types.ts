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
