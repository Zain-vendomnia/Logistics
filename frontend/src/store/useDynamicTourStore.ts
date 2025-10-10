import { StateCreator, create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import localforage from "localforage";

import { DynamicTourPayload } from "../types/tour.type";
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

const indexStorage = localforage.createInstance({
  name: "dynamic-mapBoard-heavy",
});
export async function saveDynamicToursToIndexDb(tours: DynamicTourPayload[]) {
  await indexStorage?.setItem("dynamicToursList", tours);
}
export async function loadDynamicToursFromIndexDb(): Promise<
  DynamicTourPayload[]
> {
  return (
    (await indexStorage.getItem<DynamicTourPayload[]>("dynamicToursList")) || []
  );
}
export async function clearDynamicToursFromIndexDb() {
  await indexStorage.removeItem("dynamicToursList");
}

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
  setDynamicToursList: async (dTours) => {
    set({ dynamicToursList: dTours });
    await saveDynamicToursToIndexDb(dTours);
  },

  updateDynamicToursList: async (dTour: DynamicTourPayload) =>
    set((state) => {
      const existingIndex = state.dynamicToursList.findIndex(
        (t) => t.id === dTour.id
      );

      if (existingIndex === -1) {
        const newList = [dTour, ...state.dynamicToursList];
        saveDynamicToursToIndexDb(newList);
        return { dynamicToursList: newList };
      }

      const updatedList = [...state.dynamicToursList];
      updatedList[existingIndex] = dTour;
      saveDynamicToursToIndexDb(updatedList);
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
      lastFetchedAt: state.lastFetchedAt,
      selectedTour: state.selectedTour,
      dynamicTours: state.dynamicToursList.map((t) => ({
        id: t.id,
        name: t.tour_name,
      })),
    }),
    onRehydrateStorage: () => async (state) => {
      if (!state) return;
      try {
        const dynamicTours = await loadDynamicToursFromIndexDb();
        if (dynamicTours.length) {
          state.setDynamicToursList(dynamicTours);
          // console.log(
          //   `[DynamicTourStore] Rehydrated ${dynamicTours.length} tours from IndexedDB`
          // );
        } else {
          console.warn(
            "[DynamicTourStore] No Dynamic Tours found in IndexedDB"
          );
        }
      } catch (error) {
        console.error(
          "[DynamicTourStore] Failed to load Dynamic Tours:",
          error
        );
      }
    },
  })
);

export default useDynamicTourStore;
