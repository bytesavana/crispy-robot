import { QueryClient, focusManager } from "@tanstack/react-query";
import { useCallback } from "react";
import { type AppStateStatus, Platform } from "react-native";
import { useFocusEffect } from "expo-router";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // One timed-out request in a supermarket basement shouldn't blank the screen — keep the last
      // good data and let the next poll recover.
      retry: 2,
      staleTime: 10_000,
    },
  },
});

// React Native has no window-focus event, so `refetchOnWindowFocus` is inert on native until
// focusManager is driven off AppState instead. Wired up once in the root layout.
export function onAppStateChange(status: AppStateStatus): void {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

/** Refetch when a screen regains focus. AppState only covers the whole app coming to the foreground;
 * this covers moving back to a tab that stayed mounted while the runner was on another one.
 *
 * `enabled` gates it because `refetch()` ignores the query's own `enabled` option — without this it
 * would fire a request before the provider session has resolved and the query has a real key. */
export function useRefetchOnFocus(refetch: () => unknown, enabled = true): void {
  useFocusEffect(
    useCallback(() => {
      if (enabled) refetch();
    }, [refetch, enabled]),
  );
}
