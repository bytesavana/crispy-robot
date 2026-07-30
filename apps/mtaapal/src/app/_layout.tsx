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
import { resolveDeviceLocation } from "@/lib/deviceLocation";

SplashScreen.preventAutoHideAsync().catch(() => {});

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
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    refreshAccessToken().catch(() => {});
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
    return setupTaskEventNotificationListeners();
  }, []);

  useEffect(() => {
    resolveDeviceLocation().catch(() => {});
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
