import { useEffect, useState } from "react";

export const useShakeEvery = (enabled: boolean, interval = 5000) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => setKey((k) => k + 1), interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);

  return {
    key,
    animation: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };
};
