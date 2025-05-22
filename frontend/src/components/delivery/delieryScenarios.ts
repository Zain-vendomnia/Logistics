export enum DeliveryScenario {
  hasPermit = "hasPermit",
  foundCustomer = "foundCustomer",
  customerNotFound = "customerNotFound",
  customerResponded = "customerResponded",
  findNeighborNearby = "findNeighborNearby",
  neighborAccepts = "neighborAccepts",
  noAcceptance = "noAcceptance",
}
export type DeliveryStep =
  | "captureDoorstepImage"
  | "captureParcelImage"
  | "captureCustomerSignature"
  | "findCustomer"
  | "findNeighbor"
  | "getNeighborDetails"
  | "captureNeighborDoorstepImage"
  | "captureNeighborSignature"
  | "showContactPromptAlert"
  | "showFindNeighborPromptAlert"
  | "showFindNeighborNotification"
  | "waitForResponse"
  | "returnToWarehouse";

type ConditionalStep = {
  condition: string;
  actions: DeliveryStep[];
};

export type Step = DeliveryStep | ConditionalStep;

export const deliveryScenarios: Record<DeliveryScenario, DeliveryStep[]> = {
  [DeliveryScenario.foundCustomer]: [
    // "getNeighborDetails",  // Testing Component
    "captureDoorstepImage",
    "captureParcelImage",
    "captureCustomerSignature",
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
};
