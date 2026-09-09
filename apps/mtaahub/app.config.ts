import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MtaaHub",
  slug: "mtaahub",
  owner: "byte-savana",
  scheme: "mtaahub",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./src/assets/branding/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mtaahub.app",
  },
  android: {
    package: "com.mtaahub.app",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./src/assets/branding/adaptive-icon.png",
      backgroundColor: "#1F1F1F",
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-notifications",
    "expo-splash-screen",
    "expo-status-bar",
  ],
  extra: {
    // MtaaHub reaches the fulfillment/registry/catalog services through the API gateway (one
    // origin); IdentityServer it calls directly. No agent in the loop — a runner reporting a shelf
    // price isn't having a conversation.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5070",
    identityServerUrl: process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL ?? "http://localhost:5066",
    // Its own Expo project, separate from MtaaPal's — `getExpoPushTokenAsync` needs the id and the
    // two apps ship under different credentials. Run `eas init` for the `mtaahub` slug to fill this
    // in; push registration no-ops until then.
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "" },
    // Serves the provider-registry/catalog reads from in-memory fixtures instead of the network. Off
    // unless explicitly asked for, and the UI says so on every screen while it's on — see src/lib/demo/.
    demoData: process.env.EXPO_PUBLIC_DEMO_DATA === "1" || process.env.EXPO_PUBLIC_DEMO_DATA === "true",
  },
};

export default config;
