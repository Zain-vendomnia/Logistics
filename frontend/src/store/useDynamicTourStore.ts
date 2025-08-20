import { StateCreator, create } from "zustand";
import { DynamicTourPayload } from "../types/tour.type";
import { createJSONStorage, persist } from "zustand/middleware";
import { PinboardOrder } from "../types/order.type";

export type DTourinfo_data = { dTour_id: number; tour: any; unassigned: any[] };

type DynamicTourStore = {
  pinboard_OrderList: PinboardOrder[]; // List of order IDs
  pinboard_AddOrders: (orders: PinboardOrder[]) => void;

  // State for dynamic tours
  dynamicTours: DynamicTourPayload[];
  setDynamicTours: (dTours: DynamicTourPayload[]) => void;

  selectedTour: DynamicTourPayload | null;
  setSelectedTour: (dTour: DynamicTourPayload | null) => void;

  dTourinfo_data: DTourinfo_data[];
  set_dTourinfo_data: (data: DTourinfo_data) => void;
  remove_dTourinfo_data: (dtour_id: number) => void;
};

const createDynamicTourStore: StateCreator<DynamicTourStore> = (set, get) => ({
  pinboard_OrderList: [],
  pinboard_AddOrders: (orders) =>
    set((state) => ({
      pinboard_OrderList: [...state.pinboard_OrderList, ...orders],
    })),

  dynamicTours: [],
  setDynamicTours: (dTours) => set({ dynamicTours: dTours }),

  selectedTour: null,
  setSelectedTour: (dTour) => set({ selectedTour: dTour }),

  dTourinfo_data: [],
  set_dTourinfo_data: (data: DTourinfo_data) =>
    set((state) => ({
      dTourinfo_data: [...state.dTourinfo_data, data],
    })),
  remove_dTourinfo_data: (dtour_id: number) =>
    set((state) => ({
      dTourinfo_data: state.dTourinfo_data.filter(
        (dt) => dt.dTour_id !== dtour_id
      ),
    })),
});

const useDynamicTourStore = create<DynamicTourStore>()(
  persist(createDynamicTourStore, {
    name: "dynamictour-board",
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
      orderList: state.pinboard_OrderList,
      dynamicTours: state.dynamicTours,
      selectedTour: state.selectedTour,
      dTourinfo_data: state.dTourinfo_data,
    }),
  })
);

export default useDynamicTourStore;
