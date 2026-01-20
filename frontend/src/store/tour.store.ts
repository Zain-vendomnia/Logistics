import { create, StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Tourinfo, TourRow } from "../types/tour.type";
import { Driver, Warehouse } from "../types/warehouse.type";

export type TourCategory = "completed" | "live" | "pending";

interface TourState {
  tourRows: TourRow[];
  tours: Tourinfo[];
  //   live: Tourinfo[];
  //   pending: Tourinfo[];

  warehouses: Warehouse[];
  drivers: Driver[];

  loading: Partial<Record<TourCategory, boolean>>;

  addInTourRows: (rows: TourRow[]) => void;
  removeFromTourRows: (tourId: number) => void;

  addTours: (tour: Tourinfo) => void;
  removeTour: (tourId: number) => void;
  clearTours: (category?: TourCategory) => void;

  setWarehouses: (data: Warehouse[]) => void;
  addWarehouse: (data: Warehouse) => void;

  setDrivers: (data: Driver[]) => void;
  addDriver: (data: Driver) => void;
}

const tourStore: StateCreator<TourState> = (set, get) => ({
  tourRows: [],
  tours: [],
  //   live: [],
  //   pending: [],

  warehouses: [],
  drivers: [],

  loading: {},

  addInTourRows: (data) =>
    set((state) => ({
      tourRows: [...data, ...state.tourRows],
    })),

  removeFromTourRows: (tourId) =>
    set((state) => {
      let rows = state.tourRows;
      rows = rows.filter((tr) => tr.id !== tourId);

      return { tourRows: [...rows] };
    }),

  addTours: (tour) =>
    set((state) => ({
      //   [category]: [...state[category], tour],
      tours: [...state.tours, tour],
    })),

  removeTour: (tourId) =>
    set((state) => ({
      tours: state.tours.filter((t) => t.id !== tourId),
    })),
  clearTours: () => set(() => ({ tours: [] })),
  //   clearTours: (category) =>
  //     category
  //       ? set({ [category]: [] } as any)
  //       : set({ completed: [], live: [], pending: [] }),

  setWarehouses: (data) => set({ warehouses: data }),
  addWarehouse: (warehouseObj) =>
    set((State) => ({ warehouses: [...State.warehouses, warehouseObj] })),

  setDrivers: (data) => set({ drivers: data }),
  addDriver: (data) => set((state) => ({ drivers: [...state.drivers, data] })),
});

export const useTourStore = create<TourState>()(
  devtools(persist(tourStore, { name: "tour-store" })),
);
