import { useEffect, useState } from "react";

type FetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function createFetchHook<T>(url: string): () => FetchResult<T> {
  return function useFetchData<T>(): FetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;

      setLoading(true);
      fetch(url)
        .then((response) => response.json())
        .then((res) => {
          if (isMounted) setData(res.data);
        })
        .catch((err) => {
          if (isMounted)
            setError(
              err instanceof Error ? err.message : "Error fetching API data"
            );
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }, [url]);

    return { data, loading, error };
  };
}
