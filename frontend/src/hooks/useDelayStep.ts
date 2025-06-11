import { DependencyList, useEffect, useRef } from "react";

interface Props {
  delay?: number;
  callback: () => void;
  trigger?: boolean;
  deps?: DependencyList;
}

export const useDelayStep = ({
  delay = 2000,
  callback,
  trigger = true,
  deps = [],
}: Props) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!trigger) return;

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, delay, callback, ...deps]);
};
