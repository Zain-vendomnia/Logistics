import { StateCreator, create } from "zustand";
import { DynamicTourPayload, pinboardOrder } from "../types/tour.type";

type DynamicTourStore = {
  orderList: pinboardOrder[]; // List of order IDs
  addOrders: (orders: pinboardOrder[]) => void;

  // State for dynamic tours
  dynamicTours: DynamicTourPayload[];
  setDynamicTours: (dTours: DynamicTourPayload[]) => void;

  selectedTour: DynamicTourPayload | null;
  setSelectedTour: (dTour: DynamicTourPayload) => void;
};

const createDynamicTourStore: StateCreator<DynamicTourStore> = (set, get) => ({
  orderList: [],

  addOrders: (orders) =>
    set((state) => ({
      orderList: [...state.orderList, ...orders],
    })),

  dynamicTours: [],
  setDynamicTours: (dTours) => set({ dynamicTours: dTours }),

  selectedTour: null,
  setSelectedTour: (dTour) => set({ selectedTour: dTour }),
});

const useDynamicTourStore = create<DynamicTourStore>(createDynamicTourStore);

export default useDynamicTourStore;
