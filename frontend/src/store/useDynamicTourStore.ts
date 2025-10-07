import { StateCreator, create } from "zustand";
import { DynamicTourPayload } from "../types/tour.type";
import { createJSONStorage, persist } from "zustand/middleware";
import { Order } from "../types/order.type";

type DynamicTourStore = {
  pinboard_OrderList: Order[]; // List of order IDs
  lastFetchedAt: number | null;
  pinboard_AddOrders: (orders: Order[]) => void;
  pinboard_removeOrders: (orderIds: number[]) => void;

  // State for dynamic tours
  dynamicToursList: DynamicTourPayload[];
  setDynamicToursList: (dTours: DynamicTourPayload[]) => void;
  updateDynamicToursList: (dTour: DynamicTourPayload) => void;

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

  pinboard_removeOrders: (orderIds) =>
    set((state) => ({
      pinboard_OrderList: [
        ...state.pinboard_OrderList.filter(
          (pOrder) => !orderIds.includes(pOrder.order_id)
        ),
      ],
    })),

  dynamicToursList: [],
  setDynamicToursList: (dTours) => set({ dynamicToursList: dTours }),

  updateDynamicToursList: (dTour: DynamicTourPayload) =>
    set((state) => {
      const index = state.dynamicToursList.findIndex((t) => t.id === dTour.id);
      console.log("Dynamic Tour List - changed tour Index", index);
      if (index === -1) {
        return { dynamicToursList: [dTour, ...state.dynamicToursList] };
      }

      const updatedList = [...state.dynamicToursList];
      updatedList[index] = dTour;

      return { dynamicToursList: updatedList };
    }),

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
      dynamicTours: state.dynamicToursList,
      selectedTour: state.selectedTour,
    }),
  })
);

export default useDynamicTourStore;
