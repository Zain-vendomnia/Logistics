import { useEffect, useState } from "react";

export type ProfileStatState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function createProfileStateHook<Raw, Transformed>(
  fetchFn: () => Promise<Raw>,
  transformFn?: (raw: Raw) => Transformed
): () => ProfileStatState<Transformed> {
  return function useProfileState(): ProfileStatState<Transformed> {
    const [stateData, setStateData] = useState<ProfileStatState<Transformed>>({
      data: null,
      loading: true,
      error: null,
    });

    useEffect(() => {
      let isMounted = true;

      fetchFn()
        .then((raw) => {
          if (!isMounted) return;

          const transformed = transformFn
            ? transformFn(raw)
            : (raw as any as Transformed);

          setStateData({
            data: transformed,
            loading: false,
            error: null,
          });
        })
        .catch((err) => {
          if (!isMounted) return;
          setStateData({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "An error occurred",
          });
        });

      return () => {
        isMounted = false; // Cleanup function to avoid memory leaks
      };
    }, []);

    return stateData;
  };
}
