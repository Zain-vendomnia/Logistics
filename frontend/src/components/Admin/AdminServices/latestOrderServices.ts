import adminApiService from "../../../services/adminApiService";

export interface LogisticOrder {
  order_id: number;
  order_number: string;
  customer_id: string;
  invoice_amount: string;
  payment_id: number;
  order_time: string;
  expected_delivery_time: string;
  warehouse_id: number;
  quantity: number;
  article_order_number: string;
  customer_number: string;
  firstname: string;
  lastname: string;
  email: string;
  street: string;
  zipcode: string;
  city: string;
  phone: string;
  lattitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string | null;
  drivers: Driver[];
}

export interface Driver {
  driver_id: number;
  driver_name: string;
  driver_mobile: number;
  driver_address: string;
}

export interface TourInfo {
  id: number;
  tour_name: string;
  tour_route_color : string;
  tour_startTime : string;
  tour_endTime: string,
  driver: Driver;
  order_ids: number[];
  orders: LogisticOrder[];
  tour_date: string;
}

class latestOrderServices {
  private static instance: latestOrderServices;
  private orders: LogisticOrder[] = [];
  private drivers: Driver[] = [];
  private cachedCount: number = 0;

  private tours: TourInfo[] = [];
  private cachedTourCount: number = Number(localStorage.getItem('cachedTourCount')) || 0;

  private constructor() {}

  public static getInstance(): latestOrderServices {
    if (!latestOrderServices.instance) {
      latestOrderServices.instance = new latestOrderServices();
    }
    return latestOrderServices.instance;
  }

  private async fetchTourCount(): Promise<number> {
    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/tourcount');
      const response = await adminApiService.fetchOrderTourCount(); 
      const data =  response.data;
      

      console.log("🎯 Tour count response:", data);

      if (data && Array.isArray(data) && data[0] && typeof data[0].count === 'number') {
        return data[0].count;
      }

      console.warn("⚠️ Invalid tour count response format:", data);
      return this.cachedTourCount;

    } catch (error) {
      console.error('❌ Error fetching tour count:', error);
      return this.cachedTourCount;
    }
  }

  public async getTours(): Promise<TourInfo[]> {
    const currentCount = await this.fetchTourCount();
    console.log("📊 currentCount:", currentCount, "| cachedTourCount:", this.cachedTourCount);

    if (this.tours.length > 0 && currentCount === this.cachedTourCount) {
      console.log('✅ Using cached tour data');
      return this.tours;
    }

    console.log('📡 Fetching fresh tour data');

    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/getAlltours');
      const response = adminApiService.fetchAllTours();
      const data = (await response).data as TourInfo[];

      this.tours = data;
      this.cachedTourCount = currentCount;
      localStorage.setItem('cachedTourCount', String(currentCount));
      return this.tours;

    } catch (error) {
      console.error('❌ Error fetching tours:', error);
      return [];
    }
  }

  private async fetchOrderCount(): Promise<number> {
    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/ordercount');
      const response = adminApiService.fetchOrderCount();

      const data = (await response).data;
      console.log("📦 Order count response:", data);

      if (data && Array.isArray(data) && data[0] && typeof data[0].count === 'number') {
        return data[0].count;
      }

      console.warn("⚠️ Invalid order count response format:", data);
      return this.cachedCount;

    } catch (error) {
      console.error('❌ Error fetching order count:', error);
      return this.cachedCount;
    }
  }

  public async getOrders(): Promise<LogisticOrder[]> {
    const currentCount = await this.fetchOrderCount();
    console.log("📊 currentOrderCount:", currentCount, "| cachedOrderCount:", this.cachedCount);

    if (this.orders.length > 0 && currentCount === this.cachedCount) {
      console.log('✅ Using cached full order data');
      return this.orders;
    }

    console.log('📡 Fetching fresh full order data');

    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/orders');
      const response = adminApiService.fetchAllOrders();
      const data = (await response).data as LogisticOrder[];
   

      this.orders = data;
      this.cachedCount = currentCount;

      const allDrivers = data.flatMap(order => order.drivers || []);
      const uniqueDrivers = Array.from(
        new Map(allDrivers.map(d => [d.driver_id, d])).values()
      );

      this.drivers = uniqueDrivers as Driver[];
      return this.orders;

    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      return [];
    }
  }

  public getDrivers(): Driver[] {
    return this.drivers;
  }

  public clearCache(): void {
    console.log("♻️ Clearing all cached data...");
    this.orders = [];
    this.drivers = [];
    this.tours = [];
    this.cachedCount = 0;
    this.cachedTourCount = 0;
    localStorage.removeItem('cachedTourCount');
    console.log("✅ Cache cleared.");
  }
}

export default latestOrderServices;
