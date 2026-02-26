import { useEffect, useMemo, useRef, useState } from "react";
import { fetchQuery } from "@/shared/api/queryClient";

export function useQueryResource({ key, enabled = true, staleTime = 30_000, queryFn }) {
  const cacheKey = useMemo(() => JSON.stringify(key), [key]);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  const [state, setState] = useState({
    data: null,
    isLoading: enabled,
    error: null
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const abort = new AbortController();
    let alive = true;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    Promise.resolve()
      .then(() =>
        fetchQuery(cacheKey, () => queryFnRef.current({ signal: abort.signal }), {
          staleTime,
          dedupe: false
        })
      )
      .then((data) => {
        if (!alive) {
          return;
        }
        setState({ data, isLoading: false, error: null });
      })
      .catch((error) => {
        if (!alive) {
          return;
        }
        if (error?.name === "AbortError") {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        setState({ data: null, isLoading: false, error });
      });

    return () => {
      alive = false;
      abort.abort();
    };
  }, [cacheKey, enabled, staleTime]);

  return state;
}
