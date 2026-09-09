import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { registerVendorPushToken, unregisterVendorPushToken } from "./api/notifications";
import { getEasProjectId } from "./config";
import { queryClient } from "./queryClient";

const EXPO_TOKEN_KEY = "mtaahub.expoPushToken";

// The provider the last successful registration was for. The token-rotation listener needs it, and
// reading it from here rather than importing providerSession keeps this module free of that cycle
// (providerSession → pushNotifications, for sign-out de-registration).
let registeredProviderId: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and registers this device's Expo push token against `providerId`. Best-effort
 * and silent on failure — a missed push is recoverable by the 20s job poll, and this must never block
 * or crash startup. No-ops without an EAS project id (`eas init` not run yet), same as apps/mtaapal.
 */
export async function registerForPushNotificationsAsync(providerId: string): Promise<void> {
  try {
    const projectId = getEasProjectId();
    if (!projectId) {
      console.warn("Push registration skipped: no EAS project id configured");
      return;
    }

    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") {
      console.warn("Push registration skipped: permission not granted");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerVendorPushToken(providerId, token);
    await AsyncStorage.setItem(EXPO_TOKEN_KEY, token);
    registeredProviderId = providerId;
  } catch (error) {
    console.warn("Push registration failed", error);
  }
}

/** Sign-out counterpart: tells the backend this device no longer speaks for `providerId`. */
export async function unregisterPushTokenAsync(providerId: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
    if (token) {
      await unregisterVendorPushToken(providerId, token);
      await AsyncStorage.removeItem(EXPO_TOKEN_KEY);
    }
    registeredProviderId = null;
  } catch (error) {
    console.warn("Push de-registration failed", error);
  }
}

type PushData = { kind?: string; taskId?: string; offerRef?: string };

function pushData(data: unknown): PushData {
  return (data ?? {}) as PushData;
}

/**
 * The two ways a job-offer push lands, wired once from the root layout. Returns an unsubscribe.
 * - received while foregrounded: refresh the jobs cache so the Offers badge is current.
 * - tapped: open the screen the notification is about.
 */
export function setupJobNotificationListeners(): () => void {
  const onReceived = Notifications.addNotificationReceivedListener(() => {
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  });

  const onResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    const { kind, taskId } = pushData(response.notification.request.content.data);
    if (kind === "line_response" && taskId) {
      router.push(`/(app)/job/${taskId}`);
    } else {
      router.push("/offers");
    }
  });

  // Expo can hand us a fresh token mid-session; re-register it for whoever we last registered for.
  const onTokenChange = Notifications.addPushTokenListener(({ data: token }) => {
    if (!registeredProviderId) return;
    registerVendorPushToken(registeredProviderId, token)
      .then(() => {
        console.log("Successfully re-registered push token");
        AsyncStorage.setItem(EXPO_TOKEN_KEY, token)
      })
      .catch(() => {
        console.warn("Failed to re-register push token");
      });
  });

  return () => {
    onReceived.remove();
    onResponse.remove();
    onTokenChange.remove();
  };
}
