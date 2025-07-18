import { createProfileStateHook } from "../../fn/createProfileStateHook";

export type RawTripTimeData = {
  consumedTime_MS: number;
  estimatedTime_MS: number;
};

async function fetchEstimatedTripTime(): Promise<RawTripTimeData> {
  return new Promise((resolved) =>
    setTimeout(() => {
      resolved({
        consumedTime_MS: 27700000,
        estimatedTime_MS: 28800000,
      });
    }, 6000)
  );
}

const transformData = (raw: RawTripTimeData): RawTripTimeData => ({
  consumedTime_MS: raw.consumedTime_MS,
  estimatedTime_MS: raw.estimatedTime_MS,
});

export const useEstimatedTripTime = createProfileStateHook(
  fetchEstimatedTripTime,
  transformData
);
