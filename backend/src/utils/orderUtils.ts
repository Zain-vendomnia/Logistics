export function isUrgentDelivery(
  expectedDeliveryTime: string | number | Date
): boolean {
  if (!expectedDeliveryTime) return false;

  const now = Date.now();
  let expectedTimeMs: number;

  if (expectedDeliveryTime instanceof Date) {
    expectedTimeMs = expectedDeliveryTime.getTime();
  } else if (typeof expectedDeliveryTime === "number") {
    // Detect seconds (10 digits) vs milliseconds (13 digits)
    expectedTimeMs =
      expectedDeliveryTime < 1e12
        ? expectedDeliveryTime * 1000
        : expectedDeliveryTime;
  } else {
    // string
    expectedTimeMs = new Date(expectedDeliveryTime).getTime();
  }

  // days in milliseconds
  const delayMs_Days = 4 * 24 * 3600 * 1000;

  return expectedTimeMs - now <= delayMs_Days;
}
