import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 15_000;

export interface PollingResult<T> {
  data: T | null;
  error: string | null;
  /** True only on the first load — a background refresh must not blank out a list a runner is reading. */
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
}

/**
 * Fetch on focus, then re-fetch on an interval while the screen is focused.
 *
 * Polling is a stopgap and worth naming as such: run offers expire on a timer, so a runner with the
 * app backgrounded finds out about one when they next open it. The real fix is a push at offer time,
 * which needs provider-keyed push tokens the backend doesn't have yet.
 *
 * `fetcher` must be memoized by the caller (useCallback), because it is a real dependency here: the
 * provider session loads asynchronously, so the first fetcher a screen renders with usually can't
 * fetch anything yet. Holding it in a ref instead meant that first no-op result was the only one a
 * screen ever got — an empty offers list that never filled in until you switched tabs.
 */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number = DEFAULT_INTERVAL_MS): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: "poll" | "refresh") => {
      if (mode === "refresh") setIsRefreshing(true);
      try {
        const result = await fetcher();
        if (!isMounted.current) return;
        setData(result);
        setError(null);
      } catch (caught) {
        if (!isMounted.current) return;
        // A failed *background* poll keeps the last good data on screen — losing a stop list because
        // one request timed out in a supermarket basement would be worse than showing it slightly stale.
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [fetcher],
  );

  useFocusEffect(
    useCallback(() => {
      void run("poll");
      const timer = setInterval(() => void run("poll"), intervalMs);
      return () => clearInterval(timer);
    }, [run, intervalMs]),
  );

  const refresh = useCallback(() => void run("refresh"), [run]);

  return { data, error, isLoading, isRefreshing, refresh };
}
