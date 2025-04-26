import { create, StateCreator } from "zustand";
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
  "sendSms",
  "makeCall",
  "waitForResponse",
  "markAsNotDelivered",
  "returnToWarehouse",
];
const defaultActionsCompleted: DeliveryActionsCompleted = {
  numberOfMessagesSent: 0,
  numberOfCallsMade: 0,
  ...Object.fromEntries(allDeliverySteps.map((step) => [step, false])),
};

export type DeliveryActionsCompleted = {
  [key in DeliveryStep]?: boolean;
} & {
  numberOfMessagesSent: number;
  numberOfCallsMade: number;
};

export type DeliveryState = {
  customerResponded: boolean;
  customerFoundAtLocation: boolean;

  driverReachedToLocation: boolean;

  neighborFound: boolean;
  neighborAccepts: boolean;

  noAcceptance: boolean;
};

type DeliveryStore = {
  deliveryInstanceKey: number;
  deliveryId: string;

  scenarioKey: DeliveryScenario;
  setScenario: (deliveryId: string, scenarioKey: DeliveryScenario) => void;

  deliveryState: DeliveryState;
  updateDeliveryState: (updates: Partial<DeliveryState>) => void;

  deliveryCompleted: boolean;
  ordersDeliveredSuccessfully: string[];
  ordersReturnToWareHouse: string[];

  setDeliveryCompleted: (value: boolean) => void;
  addOrdersDeliveredSuccessfully: (id: string) => void;
  addOrdersReturnToWareHouse: () => void;

  tripData: TripData | null;
  fetchTripData: () => Promise<TripData>;
  // setTripData: (data: TripData) => void;

  actionsCompleted: DeliveryActionsCompleted;
  resetActionsCompleted: () => void;
  markStepCompleted: (step: DeliveryStep) => void;
  incrementMessageSent: () => void;
  incrementCallsMade: () => void;

  resetDriverDashboard: () => Promise<void>;
};

const createDeliveryStore: StateCreator<DeliveryStore> = (set, get) => ({
  actionsCompleted: defaultActionsCompleted,
  resetActionsCompleted() {
    set(() => ({
      actionsCompleted: defaultActionsCompleted,
    }));
  },
  markStepCompleted: (step) =>
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

  scenarioKey: DeliveryScenario.hasPermit,
  setScenario: (deliveryId, scenarioKey) =>
    set(() => ({
      deliveryId,
      scenarioKey,
      deliveryCompleted: false,
      deliveryState: {
        customerResponded: false,
        customerFoundAtLocation: false,
        driverReachedToLocation: false,
        neighborFound: false,
        neighborAccepts: false,
        noAcceptance: false,
      },
    })),

  deliveryState: {
    customerResponded: false,
    customerFoundAtLocation: false,
    driverReachedToLocation: false,
    neighborFound: false,
    neighborAccepts: false,
    noAcceptance: false,
  },
  updateDeliveryState: (updates) =>
    set((state: DeliveryStore) => ({
      deliveryState: {
        ...state.deliveryState,
        ...updates,
      },
    })),

  deliveryCompleted: false,
  ordersReturnToWareHouse: [],
  ordersDeliveredSuccessfully: [],

  setDeliveryCompleted: (value: boolean) => set({ deliveryCompleted: value }),
  addOrdersReturnToWareHouse: () =>
    set((state) => ({
      ordersReturnToWareHouse: [
        ...state.ordersReturnToWareHouse,
        state.deliveryId,
      ],
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
  resetDriverDashboard: async () => {
    const newTrip = await getTripData();

    if (newTrip) {
      set({
        deliveryId: `${newTrip.orderId}_Moc2`,
        deliveryCompleted: false,
        scenarioKey: DeliveryScenario.hasPermit,
        deliveryState: {
          customerResponded: false,
          customerFoundAtLocation: false,
          driverReachedToLocation: false,
          neighborFound: false,
          neighborAccepts: false,
          noAcceptance: false,
        },
        tripData: newTrip,
      });
    }
  },
});

export const useDeliveryStore = create<DeliveryStore>(createDeliveryStore);
