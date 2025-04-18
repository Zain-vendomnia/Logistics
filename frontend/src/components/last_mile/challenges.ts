export type ChallengeActionSteps =
  | "Upload Customer Doorstep Image"
  | "Uplaod Customer Signature"
  | "Message Customer"
  | "Upload Neighbor Doorstep Image"
  | "Uplaod Neighbor Signature"
  | "Uplaod Order Delivered Image";

type ChallengeStep = ChallengeActionSteps;

export const challenges: Record<string, ChallengeStep[]> = {
  customerFound: [
    "Upload Customer Doorstep Image",
    "Uplaod Customer Signature",
    "Uplaod Order Delivered Image",
  ],
  hasPermit: ["Uplaod Customer Signature", "Uplaod Order Delivered Image"],
  customerUnavailableWithNoPermit: [
    "Upload Customer Doorstep Image",
    "Upload Neighbor Doorstep Image",
    "Uplaod Neighbor Signature",
    "Uplaod Order Delivered Image",
  ],
};
