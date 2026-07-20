// Must be the first import: @ag-ui/client generates run/thread ids via the
// `uuid` package, which needs crypto.getRandomValues — not built into Hermes.
import "react-native-get-random-values";

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { refreshAccessToken } from "@/lib/auth";
import { registerForPushNotificationsAsync, setupTaskEventNotificationListeners } from "@/lib/pushNotifications";
import { colors } from "@/theme";
import { resolveZone } from "@/lib/zoneResolution";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Proactively refresh on launch instead of waiting for the first request to hit a 401 —
    // the access token is short-lived (15 min), so it's often already stale by the time the
    // user sends their first message. A no-op for guests: refreshAccessToken() only acts when
    // a refresh token is stored, and silently signs out if that refresh token has expired.
    refreshAccessToken().catch(() => {});
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
    return setupTaskEventNotificationListeners();
  }, []);

  useEffect(() => {
    // Non-prompting: only resolves if permission was already granted in a past
    // session. Runs every cold start so a returning user's zone reflects wherever
    // they are now, without re-asking for permission.
    resolveZone().catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="location-permission" />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="cart-modal"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: "fitToContents",
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
