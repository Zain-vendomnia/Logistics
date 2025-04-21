export enum DeliveryScenario {
  foundCustomer = "foundCustomer",
  hasPermit = "hasPermit",
  customerUnavailableWithNoPermit = "customerUnavailableWithNoPermit",
}
export type DeliveryStep =
  | "captureDoorstepImage"
  | "captureParcelImage"
  | "captureCustomerSignature"
  | "captureNeighborDoorstepImage"
  | "captureNeighborSignature"
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

export const deliveryScenarios: Record<DeliveryScenario, Step[]> = {
  [DeliveryScenario.foundCustomer]: [
    // "captureDoorstepImage",
    // "captureParcelImage",
    "captureCustomerSignature",
  ],
  [DeliveryScenario.hasPermit]: ["captureDoorstepImage", "captureParcelImage"],
  [DeliveryScenario.customerUnavailableWithNoPermit]: [
    "captureDoorstepImage",
    // "sendSms",
    // "makeCall",
    // "waitForResponse",
    {
      condition: "customerResponded",
      actions: ["captureParcelImage", "captureCustomerSignature"],
    },
    {
      condition: "neighborAccepts",
      actions: [
        "captureNeighborDoorstepImage",
        "captureParcelImage",
        "captureNeighborSignature",
      ],
    },
    {
      condition: "noAcceptance",
      actions: [
        "captureDoorstepImage",
        "captureParcelImage", // proof image
        "markAsNotDelivered",
        "returnToWarehouse",
      ],
    },
  ],
};
