import { createProfileStateHook } from "../../fn/createProfileStateHook";

type RawDeliveryData = {
  completed: number;
  due: number;
};

async function fetchDailyDelivery(): Promise<RawDeliveryData> {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        completed: 120,
        due: 30,
      });
    }, 8000)
  );
}

const transformDailyDelivery = (raw: RawDeliveryData) => ({
  completed: raw.completed,
  due: raw.due,
});

export const useDailyDelivery = createProfileStateHook(
  fetchDailyDelivery,
  transformDailyDelivery
);
