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
  warehouse_id: number;
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
  tour_comments: string;
  warehouseId: number;
  tour_status:string;
}

type TourStatus = 'confirmed' | 'pending' | 'completed' | 'live';
interface TourStatusGrouped {
  confirmed: TourInfo[];
  pending: TourInfo[];
  completed: TourInfo[];
  live: TourInfo[];
}


class latestOrderServices {
  private static instance: latestOrderServices;
  private orders: LogisticOrder[] = [];
  private drivers: Driver[] = [];
  private cachedCount: number = 0;

  private tours: TourInfo[] = [];
  private cachedTourCount: number = Number(localStorage.getItem('cachedTourCount')) || 0;

  private constructor() {}
  private cachedTourLastUpdated: string | null = localStorage.getItem('cachedTourLastUpdated') || null;
  private cachedOrderLastUpdated: string | null = localStorage.getItem('cachedOrderLastUpdated') || null;
   // For tour status history
   private tourStatusHistory: {
    confirmed: TourInfo[],
    pending: TourInfo[],
    completed: TourInfo[],
    live: TourInfo[]
  } = {
    confirmed: [],
    pending: [],
    completed: [],
    live: []
  };
  private cachedTourStatusCount = 0;
  private cachedTourStatusLastUpdated: string | null = null;



  public static getInstance(): latestOrderServices {
    if (!latestOrderServices.instance) {
      latestOrderServices.instance = new latestOrderServices();
    }
    return latestOrderServices.instance;
  }

  private async fetchTourCount(): Promise<{ count: number, lastUpdated: string }> {
    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/tourcount');
      const response = await adminApiService.fetchOrderTourCount(); 
      const data = response.data[0];
      

      console.log("🎯 Tour count response:", data);

      if (data && typeof data.count === 'number' && typeof data.last_updated === 'string') {
        return { count: data.count, lastUpdated: data.last_updated };
      }

      console.warn("⚠️ Invalid tour count response format:", data);
      return { count: this.cachedTourCount, lastUpdated: this.cachedTourLastUpdated || '' };

    } catch (error) {
      console.error('❌ Error fetching tour count:', error);
      return { count: this.cachedTourCount, lastUpdated: this.cachedTourLastUpdated || '' };

    }
  }

  public async getTours(): Promise<TourInfo[]> {
    const { count: currentCount, lastUpdated: currentLastUpdated } = await this.fetchTourCount();
    console.log("📊 currentCount:", currentCount, "| cachedTourCount:", this.cachedTourCount);
   
    if (
      this.tours.length > 0 &&
      currentCount === this.cachedTourCount &&
      currentLastUpdated === this.cachedTourLastUpdated
    ) {
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
      this.cachedTourLastUpdated = currentLastUpdated;
      localStorage.setItem('cachedTourCount', String(currentCount));
      localStorage.setItem('cachedTourLastUpdated', currentLastUpdated);
      return this.tours;

    } catch (error) {
      console.error('❌ Error fetching tours:', error);
      return [];
    }
  }

  public async RealTimeToursData(): Promise<TourInfo[]> {
    try {
      const response = await adminApiService.fetchAllTours();
      this.tours = response.data as TourInfo[];
      return this.tours;
    } catch (error) {
      console.error('❌ Error fetching tours:', error);
      return [];
    }
  }

  private async fetchOrderCount(): Promise<{ count: number, lastUpdated: string }> {
    try {
      //const response = await fetch('http://localhost:8080/api/admin/routeoptimize/ordercount');
      const response = adminApiService.fetchOrderCount();

      const data = (await response).data[0];
      console.log("📦 Order count response:", data);

      if (data && typeof data.count === 'number' && typeof data.last_updated === 'string') {
        return { count: data.count, lastUpdated: data.last_updated };
      }

      console.warn("⚠️ Invalid order count response format:", data);
      return { count: this.cachedCount, lastUpdated: this.cachedOrderLastUpdated || '' };

    } catch (error) {
      console.error('❌ Error fetching order count:', error);
      return { count: this.cachedCount, lastUpdated: this.cachedOrderLastUpdated || '' };
    }
  }

  public async getOrders(): Promise<LogisticOrder[]> {
     const { count: currentCount, lastUpdated: currentLastUpdated } = await this.fetchOrderCount();
     console.log("📊 currentOrderCount:", currentCount, "| cachedOrderCount:", this.cachedCount);

     if (
      this.orders.length > 0 &&
      currentCount === this.cachedCount &&
      currentLastUpdated === this.cachedOrderLastUpdated
    ) {
      console.log('✅ Using cached order data');
      return this.orders;
    }

    console.log('📡 Fetching fresh full order data');

    try {
      // const response = await fetch('http://localhost:8080/api/admin/routeoptimize/orders');
      const response = adminApiService.fetchAllOrders();
      const data = (await response).data as LogisticOrder[];
   

      this.orders = data;
      this.cachedCount = currentCount;
      this.cachedOrderLastUpdated = currentLastUpdated;
      
      localStorage.setItem('cachedOrderCount', String(currentCount));
      localStorage.setItem('cachedOrderLastUpdated', currentLastUpdated);

      const allDrivers = data.flatMap(order => order.drivers || []);
      const uniqueDrivers = Array.from(
        new Map(allDrivers.map(d => [d.driver_id, d])).values()
      );

      console.log("🚚 Unique drivers ----> last Order service:", uniqueDrivers);
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
  public async fetchAllDrivers(): Promise<Driver[]> {
    try {
      //  Additional fallback: Include drivers from orders
      const orders = await this.getOrders();
      const orderDrivers = orders
        .filter(order => order.drivers?.length)
        .flatMap(order => order.drivers);

      // Combine and deduplicate
      this.drivers = Array.from(
        new Map([ ...orderDrivers].map(d => [d.driver_id, d])).values()
      );

      console.log("🚛 All available drivers:", this.drivers);
      return this.drivers;
    } catch (error) {
      console.error('❌ Error fetching all drivers:', error);
      return [];
    }
  }

  public async getTourStatusHistory(): Promise<{
    confirmed: TourInfo[],
    pending: TourInfo[],
    completed: TourInfo[],
    live: TourInfo[]
  }> {
    const { count, lastUpdated } = await this.fetchTourCount();

    if (
      this.cachedTourStatusLastUpdated === lastUpdated &&
      this.cachedTourStatusCount === count &&
      Object.values(this.tourStatusHistory).some(arr => arr.length > 0)
    ) {
      console.log("✅ Using cached tourStatusHistory");
      return this.tourStatusHistory;
    }

    try {
      const response = await adminApiService.fetchAlltourstatushistory();
      const allTours = response.data as TourStatusGrouped;
    
      const grouped: typeof this.tourStatusHistory = {
        confirmed: [],
        pending: [],
        completed: [],
        live: []
      };
      console.log("✅ Fetching fresh tourStatusHistory");
      for (const status of Object.keys(allTours) as TourStatus[]) {
        const tours = allTours[status];
        grouped[status].push(...tours);
      }
     
      this.tourStatusHistory = grouped;
      this.cachedTourStatusCount = count;
      this.cachedTourStatusLastUpdated = lastUpdated;

      return grouped;
    } catch (error) {
      console.error('❌ Error fetching tour status history:', error);
      return {
        confirmed: [],
        pending: [],
        completed: [],
        live: []
      };
    }
  }

  public clearCache(): void {
    console.log("♻️ Clearing all cached data...");
    this.orders = [];
    this.drivers = [];
    this.tours = [];
    this.tourStatusHistory = {
      confirmed: [],
      pending: [],
      completed: [],
      live: []
    };
    this.cachedCount = 0;
    this.cachedTourCount = 0;
    this.cachedTourStatusCount = 0;
    this.cachedOrderLastUpdated = null;
    this.cachedTourLastUpdated = null;
    this.cachedTourStatusLastUpdated = null;
    localStorage.removeItem('cachedTourCount');
    localStorage.removeItem('cachedOrderLastUpdated');
    localStorage.removeItem('cachedTourLastUpdated');
    console.log("✅ Cache cleared.");
  }
}

export default latestOrderServices;
