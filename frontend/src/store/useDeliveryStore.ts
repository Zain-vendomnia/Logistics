import { create, StateCreator } from "zustand";
import { DeliveryScenario } from "../components/common/delieryScenarios";
import { TripData, getTripData } from "../services/trip_Service";

export type DeliveryState = {
  customerResponded: boolean;
  neighborAccepts: boolean;
  noAcceptance: boolean;
};

type DeliveryStore = {
  deliveryInstanceKey: number;
  deliveryId: string;

  scenarioKey: DeliveryScenario;
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
  deliveryInstanceKey: 0,
  deliveryId: "",
  scenarioKey: DeliveryScenario.foundCustomer,
  deliveryState: {
    customerResponded: false,
    neighborAccepts: false,
    noAcceptance: false,
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
        noAcceptance: false,
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
          noAcceptance: false,
        },
        tripData: newTrip,
      });
    }
  },
  tripData: null,

  fetchTripData: async () => {
    const { deliveryCompleted, tripData, deliveryId, deliveryInstanceKey } =
      get();

    if (tripData && deliveryCompleted === false) {
      console.log("Store (cached):", tripData);
      return tripData;
    }

    const newData = await getTripData();
    if (!newData) throw new Error("Failed to fetch trip data");

    set({
      deliveryInstanceKey: deliveryInstanceKey + 1,
      deliveryId: newData.orderId,
      tripData: newData,
      deliveryCompleted: false,
    });

    console.log("Store: ", newData);
    return newData;
  },
});

export const useDeliveryStore = create<DeliveryStore>(createDeliveryStore);
