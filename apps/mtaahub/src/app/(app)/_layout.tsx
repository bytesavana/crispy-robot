import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";

import { useProviderSession } from "@/lib/providerSession";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";
import { colors, typography } from "@/theme";

export default function AppLayout() {
  const session = useProviderSession();

  // This subtree mounts only once a session is ready, i.e. right after every sign-in — so this is the
  // "register on login" hook. Idempotent server-side and it re-claims the token for the current
  // provider, so running it on each provider-id change is intended.
  useEffect(() => {
    if (session?.providerId) registerForPushNotificationsAsync(session.providerId).catch(() => {});
  }, [session?.providerId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { ...typography.label, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      {/* Pushed onto the tab stack from the bell icon / a job card, so they keep the tab bar. */}
      <Tabs.Screen name="offers" options={{ href: null }} />
      <Tabs.Screen name="coverage" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="job/[taskId]" options={{ href: null }} />
    </Tabs>
  );
}
