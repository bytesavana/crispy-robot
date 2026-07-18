import Constants from "expo-constants";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { switchToConversation } from "./agUiClient";
import { fetchConversation, registerPushToken } from "./conversationsApi";
import { getThreadId } from "./session";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

/**
 * Requests notification permission and registers this device's Expo push token with the
 * backend. Best-effort and silent on failure — a push notification is a "nice to have" live
 * signal for background fulfillment events (see effective-happiness/didactic-invention), not
 * something that should ever block or crash app startup. No-ops without an EAS project id
 * configured (`expo.extra.eas.projectId`, set by `eas init`) since getExpoPushTokenAsync
 * requires one — that provisioning step isn't done yet for this app.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
  try {
    const projectId = getEasProjectId();
    if (!projectId) {
      console.warn("Push notification registration skipped: no EAS project id configured");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") {
      console.warn("Push notification registration skipped: permission not granted");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token);
  } catch (error) {
    console.warn("Push notification registration failed", error);
  }
}

async function refreshThreadFromNotification(threadId: string): Promise<void> {
  const { messages, state } = await fetchConversation(threadId);
  switchToConversation(threadId, messages, state);
}

function threadIdFrom(data: Record<string, unknown> | undefined): string | undefined {
  const value = data?.threadId;
  return typeof value === "string" ? value : undefined;
}

/**
 * Wires up the two ways a task-event push notification can land, mirroring
 * HistoryDrawerContent's handleSelectConversation refresh pattern:
 * - received while foregrounded: only refresh if it's for the thread currently open, so a
 *   notification about some other conversation never yanks the user away from what they're doing.
 * - tapped (from background or a killed app): always navigate to that thread.
 * Returns an unsubscribe function; call once from the root layout.
 */
export function setupTaskEventNotificationListeners(): () => void {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const threadId = threadIdFrom(notification.request.content.data);
    if (threadId && threadId === getThreadId()) {
      refreshThreadFromNotification(threadId).catch(() => {});
    }
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const threadId = threadIdFrom(response.notification.request.content.data);
    if (!threadId) return;
    refreshThreadFromNotification(threadId)
      .then(() => router.push("/"))
      .catch(() => {});
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
