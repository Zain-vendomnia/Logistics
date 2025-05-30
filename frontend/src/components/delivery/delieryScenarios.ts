export enum DeliveryScenario {
  hasPermit = "hasPermit",
  foundCustomer = "foundCustomer",
  customerNotFound = "customerNotFound",
  customerResponded = "customerResponded",
  findNeighborNearby = "findNeighborNearby",
  neighborAccepts = "neighborAccepts",
  noAcceptance = "noAcceptance",
  damagedParcel = "damagedParcel",
  orderReturn = "orderReturn",
}

const deliverySteps = [
  "captureDoorstepImage",
  "captureParcelImage",
  "captureCustomerSignature",
  "findCustomer",
  "findNeighbor",
  "getNeighborDetails",
  "captureNeighborDoorstepImage",
  "captureNeighborSignature",
  "showContactPromptAlert",
  "showFindNeighborPromptAlert",
  "showFindNeighborNotification",
  "waitForResponse",
  "getRating",
  "returnToWarehouse",
  "damagedParcelImage",
  "notifyForOrderReturn",
] as const;
export type DeliveryStep = (typeof deliverySteps)[number];

type ConditionalStep = {
  condition: string;
  actions: DeliveryStep[];
};

export type Step = DeliveryStep | ConditionalStep;

export const deliveryScenarios: Record<DeliveryScenario, DeliveryStep[]> = {
  [DeliveryScenario.foundCustomer]: [
    "captureDoorstepImage",
    "captureParcelImage",
    "captureCustomerSignature",
    // "getRating",
  ],
  [DeliveryScenario.customerNotFound]: [
    "captureDoorstepImage",
    "showContactPromptAlert",
    "showFindNeighborNotification",
    // wait untill customer is communicated
    // "showFindNeighborPromptAlert",
    "findNeighbor",
  ],
  [DeliveryScenario.hasPermit]: ["captureDoorstepImage", "captureParcelImage"],

  [DeliveryScenario.customerResponded]: [
    "captureParcelImage",
    "captureCustomerSignature",
  ],

  [DeliveryScenario.findNeighborNearby]: [
    "showContactPromptAlert",
    "findNeighbor",
  ],

  [DeliveryScenario.neighborAccepts]: [
    "captureDoorstepImage",
    "getNeighborDetails",
    "captureNeighborDoorstepImage",
    "captureParcelImage",
    "captureNeighborSignature",
  ],
  [DeliveryScenario.noAcceptance]: [
    "captureDoorstepImage",
    // "captureParcelImage", // proof image
    "returnToWarehouse",
  ],
  [DeliveryScenario.damagedParcel]: [
    "captureDoorstepImage",
    "damagedParcelImage",
  ],
  [DeliveryScenario.orderReturn]: [
    "captureDoorstepImage",
    "notifyForOrderReturn",
  ],
};
