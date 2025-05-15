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
  | "captureNeighborDoorstepImage"
  | "captureNeighborSignature"
  | "showContactPromptAlert"
  | "showFindNeighborPromptAlert"
  | "waitForResponse"
  | "returnToWarehouse";

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
  ],
  [DeliveryScenario.customerNotFound]: [
    "captureDoorstepImage",
    "showContactPromptAlert",
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
