export enum DeliveryScenario {
  hasPermit = "hasPermit",
  foundCustomer = "foundCustomer",
  customerNotFound = "customerNotFound",
  // customerUnavailableWithNoPermit = "customerUnavailableWithNoPermit",
  customerResponded = "customerResponded",
  findNeighborNearby = "findNeighborNearby",
  neighborAccepts = "neighborAccepts",
  noAcceptance = "noAcceptance",
}
export type DeliveryStep =
  | "captureDoorstepImage"
  | "captureParcelImage"
  | "captureCustomerSignature"
  | "findNeighbor"
  | "captureNeighborDoorstepImage"
  | "captureNeighborSignature"
  | "showContactPromptAlert"
  | "sendSms"
  | "makeCall"
  | "waitForResponse"
  | "markAsNotDelivered"
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
    "showContactPromptAlert",
    "sendSms",
    "makeCall",
  ],
  [DeliveryScenario.hasPermit]: ["captureDoorstepImage", "captureParcelImage"],
  // [DeliveryScenario.customerUnavailableWithNoPermit]: [
  //   "captureDoorstepImage",
  //   "showContactPromptAlert",
  //   // "sendSms",
  //   // "makeCall",
  //   // "waitForResponse",
  //   {
  //     condition: "customerResponded",
  //     actions: ["captureParcelImage", "captureCustomerSignature"],
  //   },
  //   {
  //     condition: "neighborAccepts",
  //     actions: [
  //       "captureNeighborDoorstepImage",
  //       "captureParcelImage",
  //       "captureNeighborSignature",
  //     ],
  //   },
  //   {
  //     condition: "noAcceptance",
  //     actions: [
  //       "captureDoorstepImage",
  //       "captureParcelImage", // proof image
  //       "markAsNotDelivered",
  //       "returnToWarehouse",
  //     ],
  //   },
  // ],
  [DeliveryScenario.customerResponded]: [
    "captureParcelImage",
    "captureCustomerSignature",
  ],

  [DeliveryScenario.findNeighborNearby]: ["showContactPromptAlert", "findNeighbor"],

  [DeliveryScenario.neighborAccepts]: [
    "captureDoorstepImage",
    "captureNeighborDoorstepImage",
    "captureParcelImage",
    "captureNeighborSignature",
  ],
  [DeliveryScenario.noAcceptance]: [
    "captureDoorstepImage",
    "captureParcelImage", // proof image
    "markAsNotDelivered",
    "returnToWarehouse",
  ],
};
