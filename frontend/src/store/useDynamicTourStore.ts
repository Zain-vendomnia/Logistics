import { StateCreator, create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import localforage from "localforage";

import { DynamicTourPayload } from "../types/tour.type";
import { Order } from "../types/order.type";

const indexStorage = localforage.createInstance({
  name: "dynamic-mapBoard-heavy",
});
export async function saveDynamicToursToIndex(tours: DynamicTourPayload[]) {
  await indexStorage?.setItem("dynamicToursList", tours);
}
export async function loadDynamicToursFromIndex(): Promise<
  DynamicTourPayload[]
> {
  return (
    (await indexStorage.getItem<DynamicTourPayload[]>("dynamicToursList")) || []
  );
}
export async function clearDynamicToursFromIndex() {
  await indexStorage.removeItem("dynamicToursList");
}

export async function saveDToursOrders(orders: Order[]) {
  await indexStorage?.setItem("dtoursOrders", orders);
}
export async function fetchDToursOrders() {
  return (await indexStorage?.getItem<Order[]>("dtoursOrders")) ?? [];
}
export async function getDToursOrders(orderIds: number[]) {
  const orders = await indexStorage?.getItem<Order[]>("dtoursOrders");
  if (!orders) return [];
  return orders.filter((o) => orderIds.includes(o.order_id));
}
export async function clearDToursOrders() {
  await indexStorage.removeItem("dtoursOrders");
}

type DynamicTourStore = {
  pinboard_OrderList: Order[]; // List of order IDs
  lastFetchedAt: number | null;
  pinboard_AddOrders: (orders: Order[]) => void;
  pinboard_removeOrders: (orderIds: number[]) => void;

  // State for dynamic tours
  dynamicToursList: DynamicTourPayload[];
  setDynamicToursList: (dTours: DynamicTourPayload[]) => void;
  updateDynamicToursList: (dTour: DynamicTourPayload) => void;

  dtoursOrders: Order[];
  setDToursOrders: (orders: Order[]) => void;
  updateDToursOrders: (orders: Order[]) => void;
  removeDToursOrders: (orderIds: number[]) => void;
  clearDToursOrders: () => void;

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
  setDynamicToursList: async (dTours) => {
    set({ dynamicToursList: dTours });
    await saveDynamicToursToIndex(dTours);
  },

  updateDynamicToursList: async (dTour: DynamicTourPayload) =>
    set((state) => {
      const existingIndex = state.dynamicToursList.findIndex(
        (t) => t.id === dTour.id
      );

      if (existingIndex === -1) {
        state.dynamicToursList.sort(
          (a, b) =>
            new Date(b.created_at!).getDate() -
            new Date(a.created_at!).getDate()
        );

        const newList = [dTour, ...state.dynamicToursList];
        saveDynamicToursToIndex(newList);
        return { dynamicToursList: newList };
      }

      const updatedList = [...state.dynamicToursList];
      updatedList[existingIndex] = dTour;
      saveDynamicToursToIndex(updatedList);
      return { dynamicToursList: updatedList };
    }),

  dtoursOrders: [] as Order[],
  setDToursOrders: async (orders: Order[]) => {
    set({ dtoursOrders: orders });
    await saveDToursOrders(orders);
  },
  updateDToursOrders: async (orders: Order[]) => {
    const current = get().dtoursOrders;

    const map = new Map(current.map((o) => [o.order_id, o]));
    orders.forEach((order) => map.set(order.order_id, order));

    const updated = Array.from(map.values());
    set({ dtoursOrders: updated });
    await saveDToursOrders(updated);
  },
  removeDToursOrders: async (orderIds) => {
    const filtered = get().dtoursOrders.filter(
      (o) => !orderIds.includes(o.order_id)
    );
    set({ dtoursOrders: filtered });
    await saveDToursOrders(filtered);
  },

  clearDToursOrders: async () => {
    set({ dtoursOrders: [] });
    await clearDToursOrders();
  },

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
    onRehydrateStorage: () => async (state, error) => {
      if (!state) return;
      if (error) {
        console.error("Error during Dynamic Tour rehydration:", error);
        return;
      }
      try {
        const orders = await fetchDToursOrders();
        if (orders) {
          state.setDToursOrders(orders);
        }

        const dynamicTours = await loadDynamicToursFromIndex();
        if (dynamicTours.length) {
          state.setDynamicToursList(dynamicTours);
          // console.log(
          //   `[DynamicTourStore] Rehydrated ${dynamicTours.length} tours from IndexedDB`
          // );
        } else {
          console.warn("[DynamicTourStore] No Dynamic Tours found in DB");
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
