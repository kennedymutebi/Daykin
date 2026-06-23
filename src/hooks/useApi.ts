// ─────────────────────────────────────────────────────────────────────────────
// useApi HOOK
// ─────────────────────────────────────────────────────────────────────────────
// Wraps any async service call with:
//   • loading state
//   • typed data state
//   • structured ApiError state (access .firstError, .fieldErrors, etc.)
//   • automatic abort on unmount
//
// Usage:
//   const { data, loading, error, execute } = useApi(getArticles);
//   await execute({ category: "sports" });
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import { ApiError } from "../services/api.service";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiReturn<T, Args extends unknown[]> extends UseApiState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, Args extends unknown[]>(
  serviceFunction: (...args: Args) => Promise<T>,
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await serviceFunction(...args);
        if (isMounted.current) {
          setState({ data: result, loading: false, error: null });
        }
        return result;
      } catch (err) {
        if (isMounted.current) {
          const apiErr =
            err instanceof ApiError
              ? err
              : new ApiError(
                  err instanceof Error ? err.message : "Unknown error",
                  0,
                  null,
                );
          setState({ data: null, loading: false, error: apiErr });
        }
        return null;
      }
    },
    [serviceFunction],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// useApiOnMount — auto-executes on mount
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   const { data, loading, error } = useApiOnMount(getArticles, { category: "sports" });
// ─────────────────────────────────────────────────────────────────────────────

export function useApiOnMount<T, Args extends unknown[]>(
  serviceFunction: (...args: Args) => Promise<T>,
  ...args: Args
): UseApiState<T> & { refetch: () => void } {
  const { data, loading, error, execute } = useApi(serviceFunction);

  const refetch = useCallback(() => {
    execute(...args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, JSON.stringify(args)]);

  useEffect(() => {
    execute(...args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch };
}