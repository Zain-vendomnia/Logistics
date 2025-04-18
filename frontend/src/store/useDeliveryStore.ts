import { create, StateCreator } from "zustand";
import { DeliveryScenario } from "../components/common/delieryScenarios";
import { TripData, getTripData } from "../services/trip_Service";

export type DeliveryState = {
  customerResponded: boolean;
  neighborAccepts: boolean;
};

type DeliveryStore = {
  deliveryId: string;

  scenarioKey: DeliveryScenario | null;
  deliveryState: DeliveryState;

  deliveryCompleted: boolean;
  ordersDeliveredSuccessfully: string[];
  ordersReturnToWareHouse: string[];

  setScenario: (deliveryId: string, scenarioKey: DeliveryScenario) => void;
  updateState: (updates: Partial<DeliveryState>) => void;

  setDeliveryCompleted: (value: boolean) => void;
  addOrdersDeliveredSuccessfully: (id: string) => void;
  addOrdersReturnToWareHouse: () => void;

  tripData: TripData | null;
  fetchTripData: () => Promise<TripData>;
  // setTripData: (data: TripData) => void;
  resetDriverDashboard: () => Promise<void>;
};

const createDeliveryStore: StateCreator<DeliveryStore> = (set, get) => ({
  deliveryId: "",
  scenarioKey: null,
  deliveryState: {
    customerResponded: false,
    neighborAccepts: false,
  },

  deliveryCompleted: false,

  ordersReturnToWareHouse: [],
  ordersDeliveredSuccessfully: [],

  setScenario: (deliveryId, scenarioKey) =>
    set(() => ({
      deliveryId,
      scenarioKey,
      deliveryCompleted: false,
      deliveryState: {
        customerResponded: false,
        neighborAccepts: false,
      },
    })),
  updateState: (updates) =>
    set((state: DeliveryStore) => ({
      deliveryState: {
        ...state.deliveryState,
        ...updates,
      },
    })),

  addOrdersReturnToWareHouse: () =>
    set((state) => ({
      ordersReturnToWareHouse: [
        ...state.ordersReturnToWareHouse,
        state.deliveryId,
      ],
    })),

  setDeliveryCompleted: (value: boolean) => set({ deliveryCompleted: value }),

  addOrdersDeliveredSuccessfully: (id: string) =>
    set((state) => ({
      ordersDeliveredSuccessfully: state.ordersDeliveredSuccessfully.includes(
        id
      )
        ? state.ordersDeliveredSuccessfully
        : [...state.ordersDeliveredSuccessfully, id],
    })),

  resetDriverDashboard: async () => {
    const newTrip = await getTripData();

    if (newTrip) {
      set({
        deliveryId: `${newTrip.orderId}_Moc2`,
        deliveryCompleted: false,
        scenarioKey: DeliveryScenario.hasPermit,
        deliveryState: {
          customerResponded: false,
          neighborAccepts: false,
        },
        tripData: newTrip,
      });
    }
  },
  tripData: null,
  fetchTripData: async () => {
    const state = get();
    const { tripData, ordersDeliveredSuccessfully, ordersReturnToWareHouse } =
      state;

    if (
      tripData &&
      !ordersDeliveredSuccessfully.includes(tripData.orderId) &&
      !ordersReturnToWareHouse.includes(tripData.orderId)
    ) {
      return tripData;
    }
    const data = await getTripData();
    if (!data) throw new Error("Failed to fetch trip data");

    set({ tripData: data });
    return data;
  },
  // setTripData: (data: TripData) => set({ tripData: data }),
});

export const useDeliveryStore = create<DeliveryStore>(createDeliveryStore);
