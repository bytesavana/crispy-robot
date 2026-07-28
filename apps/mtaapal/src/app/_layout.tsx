// Must be the first import: @ag-ui/client generates run/thread ids via the
// `uuid` package, which needs crypto.getRandomValues — not built into Hermes.
import "react-native-get-random-values";

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/AnimatedSplash";
import { refreshAccessToken } from "@/lib/auth";
import { useIsAddressPickRequested } from "@/lib/locationPickerBridge";
import { registerForPushNotificationsAsync, setupTaskEventNotificationListeners } from "@/lib/pushNotifications";
import { colors } from "@/theme";
import { resolveZone } from "@/lib/zoneResolution";

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Renders nothing — its only job is watching for a location pick request
 * (from either the agent's ask_customer_for_address tool call or a manual
 * pickLocation()) and pushing the modal, regardless of which screen is
 * currently active. Mounted once, at the root, since both trigger paths can
 * fire from anywhere.
 */
function LocationPickerRouter() {
  const requested = useIsAddressPickRequested();
  useEffect(() => {
    if (requested) router.push("/location-modal");
  }, [requested]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
  });
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    // Dismiss the static native splash as soon as JS is ready, then hand off to
    // AnimatedSplash so the logo animation plays over the real app instead of a blank gap.
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
          <Stack.Screen
            name="location-modal"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.6, 0.92],
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
            }}
          />
        </Stack>
        <LocationPickerRouter />
        {showAnimatedSplash && (
          <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
