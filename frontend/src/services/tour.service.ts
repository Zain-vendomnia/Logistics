import { TourCategory, useTourStore } from "../store/tour.store";
import { Order } from "../types/order.type";
import {
  rejectTour_Req,
  Tourinfo,
  TourRow,
  TourStatus,
  UpdateTour_Req,
} from "../types/tour.type";
import { Driver, Warehouse } from "../types/warehouse.type";
import adminApiService from "./adminApiService";

class TourService {
  // Tours
  async getTourRows(category: TourStatus, force = false): Promise<TourRow[]> {
    const { tourRows, addInTourRows: updateTourRows } = useTourStore.getState();

    if (tourRows.length && !force) {
      const categoryTours = tourRows.filter((t) => t.tour_status === category);
      return categoryTours;
    }

    const tourslist = await adminApiService.fetchToursByStatus(category);
    updateTourRows(tourslist);

    return tourslist;
  }

  async getTourDetails(id: number, force = false): Promise<Tourinfo> {
    const { tours, addTours } = useTourStore.getState();
    const tourObj = tours.find((tr) => tr.id === id);

    if (tourObj && !force) {
      return tourObj;
    }

    const tour = await adminApiService.fetchTourDetails(id);
    addTours(tour);

    return tour;
  }

  //   async getLiveTours(id: number, force = false): Promise<Tourinfo> {
  //     const { live, addTours } = useTourStore.getState();

  //     if (live.length && !force) {
  //       return live;
  //     }

  //     const res = await adminApiService.getTour(id);
  //     addTours("live", res.data);

  //     return res.data;
  //   }

  //   async getScheduledTours(force = false): Promise<Tourinfo> {
  //     const { pending, addTours } = useTourStore.getState();

  //     if (pending.length && !force) {
  //       return pending;
  //     }

  //     const res = await adminApiService.fetchScheduledTours();
  //     addTours("pending", res.data);

  //     return res.data;
  //   }

  //   Supporting Data

  async getWarehouseDetails(whId: number, force = false): Promise<Warehouse> {
    const { warehouses, addWarehouse } = useTourStore.getState();
    let whObj = warehouses.find((wh) => wh.id === whId);
    if (whObj && !force) {
      return whObj;
    }

    whObj = await adminApiService.getWarehouse(whId);
    addWarehouse(whObj);

    return whObj;
  }

  //   async getDriverDetails(dId: number, force = false): Promise<Driver> {
  //     const { drivers, addDriver } = useTourStore.getState();
  //     let driverObj = drivers.find((d) => d.id === dId);
  //     if (driverObj && !force) {
  //       return driverObj;
  //     }

  //     const driverObj = await adminApiService.fetchDrivers();
  //     addDriver(driverObj);

  //     return driverObj;
  //   }

  async updateTour(updateTour: UpdateTour_Req) {
    const updateTourRes = await adminApiService.updateTour(updateTour);

    const { removeTour, addTours } = useTourStore.getState();

    removeTour(updateTour.id);
    addTours(updateTourRes);

    return updateTourRes;
  }

  async getPinboardOrders(lastFetchedAt: number | null): Promise<Order[]> {
    const orders: Order[] =
      await adminApiService.fetchPinboardOrders(lastFetchedAt);

    return orders;
  }

  async rejectTourInstance(request: rejectTour_Req) {
    const { removeFromTourRows } = useTourStore.getState();

    await adminApiService.rejectDynamicTour(request);
    // console.log(`Tour rejected`);

    removeFromTourRows(request.tour_id);
  }
}

export const tourService = new TourService();
