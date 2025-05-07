import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DeliveryScenario,
  DeliveryStep,
} from "../components/delivery/delieryScenarios";
import { TripData, getTripData } from "../services/trip_Service";

const allDeliverySteps: DeliveryStep[] = [
  "captureDoorstepImage",
  "captureParcelImage",
  "captureCustomerSignature",
  "captureNeighborDoorstepImage",
  "captureNeighborSignature",
  "showContactPromptAlert",
  "waitForResponse",
  "returnToWarehouse",
];

export type DeliveryActionsCompleted = {
  [key in DeliveryStep]?: boolean;
} & {
  numberOfMessagesSent: number;
  numberOfCallsMade: number;
};
const defaultActionsCompleted: DeliveryActionsCompleted = {
  numberOfMessagesSent: 0,
  numberOfCallsMade: 0,
  ...Object.fromEntries(allDeliverySteps.map((step) => [step, false])),
};

export type DeliveryState = {
  customerResponded: boolean;
  customerRespondedStatement: string;
  customerFoundAtLocation: boolean;
  driverReachedToLocation: boolean;
  neighborFound: boolean;
  neighborAccepts: boolean;
  noAcceptance: boolean;
  deliveryReturnReason: string;
};
const defaultDeliveryState = {
  customerResponded: false,
  customerRespondedStatement: "",
  customerFoundAtLocation: false,
  driverReachedToLocation: false,
  neighborFound: false,
  neighborAccepts: false,
  noAcceptance: false,
  deliveryReturnReason: "",
};

type DeliveryStore = {
  deliveryInstanceKey: number;
  deliveryId: string;
  scenarioKey: DeliveryScenario | null;
  setScenario: (deliveryId: string, scenarioKey: DeliveryScenario) => void;

  deliveryState: DeliveryState;
  updateDeliveryState: (updates: Partial<DeliveryState>) => void;
  resetDeliveryState: () => void;

  deliveryCompleted: boolean;
  ordersDeliveredSuccessfully: string[];
  ordersReturnToWareHouse: string[];

  setDeliveryCompleted: (value: boolean) => void;
  addOrdersDeliveredSuccessfully: (id: string) => void;
  addOrdersReturnToWareHouse: (id: string) => void;

  tripData: TripData | null;
  fetchTripData: () => Promise<TripData>;

  actionsCompleted: DeliveryActionsCompleted;
  resetActionsCompleted: () => void;
  markStepCompleted: (step: DeliveryStep) => void;
  incrementMessageSent: () => void;
  incrementCallsMade: () => void;

  success: boolean | null;
  setSuccess: (success: boolean | null) => void;

  isContactIconsBlinking: boolean | null;
  setContactIconsBlinking: (value: boolean) => void;
};

export const defaultDeliveryStoreState = {
  deliveryInstanceKey: 0,
  deliveryId: "",
  scenarioKey: null,
  deliveryState: { ...defaultDeliveryState },
  deliveryCompleted: false,
  ordersDeliveredSuccessfully: [],
  ordersReturnToWareHouse: [],
  tripData: null,
  actionsCompleted: defaultActionsCompleted,
  success: null,
  isContactIconsBlinking: null,
};

const createDeliveryStore: StateCreator<DeliveryStore> = (set, get) => ({
  actionsCompleted: { ...defaultActionsCompleted },
  resetActionsCompleted() {
    set(() => ({
      actionsCompleted: { ...defaultActionsCompleted },
    }));
  },
  markStepCompleted: (step: DeliveryStep) =>
    set((state) => ({
      actionsCompleted: {
        ...state.actionsCompleted,
        [step]: true,
      },
    })),

  incrementMessageSent: () => {
    set((state) => ({
      actionsCompleted: {
        ...state.actionsCompleted,
        numberOfMessagesSent: state.actionsCompleted.numberOfMessagesSent + 1,
      },
    }));
  },

  incrementCallsMade: () => {
    set((state) => ({
      actionsCompleted: {
        ...state.actionsCompleted,
        numberOfCallsMade: state.actionsCompleted.numberOfCallsMade + 1,
      },
    }));
  },

  deliveryInstanceKey: 0,
  deliveryId: "",

  scenarioKey: null,
  setScenario: (deliveryId, scenarioKey) =>
    set((state) => ({
      deliveryId,
      scenarioKey,
      deliveryCompleted: false,
      deliveryState: {
        ...state.deliveryState,
      },
    })),

  deliveryState: { ...defaultDeliveryState },
  updateDeliveryState: (updates) =>
    set((state: DeliveryStore) => ({
      deliveryState: {
        ...state.deliveryState,
        ...updates,
      },
    })),

  resetDeliveryState: () =>
    set(() => ({
      deliveryState: { ...defaultDeliveryState },
    })),

  deliveryCompleted: false,
  ordersReturnToWareHouse: [],
  ordersDeliveredSuccessfully: [],

  setDeliveryCompleted: (value: boolean) => set({ deliveryCompleted: value }),
  addOrdersReturnToWareHouse: (id: string) =>
    set((state) => ({
      ordersReturnToWareHouse: state.ordersReturnToWareHouse.includes(id)
        ? state.ordersReturnToWareHouse
        : [...state.ordersReturnToWareHouse, id],
    })),
  addOrdersDeliveredSuccessfully: (id: string) =>
    set((state) => ({
      ordersDeliveredSuccessfully: state.ordersDeliveredSuccessfully.includes(
        id
      )
        ? state.ordersDeliveredSuccessfully
        : [...state.ordersDeliveredSuccessfully, id],
    })),

  tripData: null,
  fetchTripData: async () => {
    const { deliveryCompleted, tripData, deliveryInstanceKey } = get();

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

  success: null,
  setSuccess: (success) =>
    set(() => ({
      success,
    })),

  isContactIconsBlinking: null,
  setContactIconsBlinking: (value) =>
    set(() => ({
      isContactIconsBlinking: value,
    })),
});

// export const useDeliveryStore = create<DeliveryStore>(createDeliveryStore);
export const useDeliveryStore = create<DeliveryStore>()(
  persist(createDeliveryStore, {
    name: "delivery-store",
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
      deliveryInstanceKey: state.deliveryInstanceKey,
      deliveryId: state.deliveryId,
      scenarioKey: state.scenarioKey,
      deliveryState: state.deliveryState,
      deliveryCompleted: state.deliveryCompleted,
      ordersDeliveredSuccessfully: state.ordersDeliveredSuccessfully,
      ordersReturnToWareHouse: state.ordersReturnToWareHouse,
      tripData: state.tripData,
      actionsCompleted: state.actionsCompleted,
      // success: state.success,
    }),
  })
);
