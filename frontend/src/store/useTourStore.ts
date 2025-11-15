import { StateCreator, create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import localforage from "localforage";

import { TourPayload } from "../types/tour.type";
import { Order } from "../types/order.type";


type TourStore = {
  lastFetchedAt: Date | null;

  toursList: TourPayload[];
  setToursList: (sTours: TourPayload[]) => void;
  updateToursList: (sTour: TourPayload) => void;

  // selectedTour: TourPayload | null;
  // setSelectedTour: (sTour: TourPayload | null) => void;
};

const createTourStore: StateCreator<TourStore> = (set, get) => ({
  lastFetchedAt: null,


  toursList: [],
  setToursList: async (sTours) => {
    set({ toursList: sTours });
  },

  updateToursList: async (sTour: TourPayload) =>
    set((state) => {
      const existingIndex = state.toursList.findIndex(
        (t) => t.id === sTour.id
      );

      if (existingIndex === -1) {
        const newList = [sTour, ...state.toursList];
        return { toursList: newList };
      }

      const updatedList = [...state.toursList];
      updatedList[existingIndex] = sTour;
      return { toursList: updatedList };
    }),
});

const useTourStore = create<TourStore>()(
  persist(createTourStore, {
    name: "tour-mapboard",
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
      lastFetchedAt: state.lastFetchedAt,
      tours: state.toursList.map((t) => ({
        id: t.id,
        name: t.tour_name,
      })),
    }),

   
  })
);



export default useTourStore;
