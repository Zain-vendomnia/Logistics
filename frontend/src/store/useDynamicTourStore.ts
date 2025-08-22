import { StateCreator, create } from "zustand";
import { DynamicTourPayload } from "../types/tour.type";
import { createJSONStorage, persist } from "zustand/middleware";
import { PinboardOrder } from "../types/order.type";

type DynamicTourStore = {
  pinboard_OrderList: PinboardOrder[]; // List of order IDs
  lastFetchedAt: number | null;
  pinboard_AddOrders: (orders: PinboardOrder[]) => void;

  // State for dynamic tours
  dynamicTours: DynamicTourPayload[];
  setDynamicTours: (dTours: DynamicTourPayload[]) => void;

  selectedTour: DynamicTourPayload | null;
  setSelectedTour: (dTour: DynamicTourPayload | null) => void;
};

const createDynamicTourStore: StateCreator<DynamicTourStore> = (set, get) => ({
  pinboard_OrderList: [],
  lastFetchedAt: null,
  pinboard_AddOrders: (orders) =>
    set((state) => ({
      pinboard_OrderList: [...state.pinboard_OrderList, ...orders],
      lastFetchedAt: Date.now(),
    })),

  dynamicTours: [],
  setDynamicTours: (dTours) => set({ dynamicTours: dTours }),

  selectedTour: null,
  setSelectedTour: (dTour) => set({ selectedTour: dTour }),
});

const useDynamicTourStore = create<DynamicTourStore>()(
  persist(createDynamicTourStore, {
    name: "dynamic-mapboard",
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
      pOrderList: state.pinboard_OrderList,
      dynamicTours: state.dynamicTours,
      selectedTour: state.selectedTour,
    }),
  })
);

export default useDynamicTourStore;
