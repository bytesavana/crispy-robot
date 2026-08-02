import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  // "MtaaPal for Business" is the product name shown to shops and runners — MtaaHub is this repo's
  // internal name for it, same relationship as the "crispy-robot" repo containing "MtaaPal" the app.
  name: "MtaaPal for Business",
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
    // Same dark backdrop as apps/mtaapal's adaptive icon — one icon mark shared by both apps.
    adaptiveIcon: {
      foregroundImage: "./src/assets/branding/adaptive-icon.png",
      backgroundColor: "#1F1F1F",
    },
  },
  plugins: ["expo-router", "expo-font", "expo-secure-store", "expo-splash-screen", "expo-status-bar"],
  extra: {
    // MtaaHub talks to the fulfillment services directly — there's no agent in the loop, because a
    // runner reporting a shelf price isn't having a conversation.
    orchestratorUrl: process.env.EXPO_PUBLIC_ORCHESTRATOR_URL ?? "http://localhost:5063",
    providerRegistryUrl: process.env.EXPO_PUBLIC_PROVIDER_REGISTRY_URL ?? "http://localhost:5064",
    serviceCatalogUrl: process.env.EXPO_PUBLIC_SERVICE_CATALOG_URL ?? "http://localhost:5062",
    identityServerUrl: process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL ?? "http://localhost:5066",
    // Serves the whole fulfillment side from in-memory fixtures instead of the network, so the app
    // can be walked with no backend running. Off unless explicitly asked for, and the UI says so on
    // every screen while it's on — see src/lib/demo/.
    demoData: process.env.EXPO_PUBLIC_DEMO_DATA === "1" || process.env.EXPO_PUBLIC_DEMO_DATA === "true",
  },
};

export default config;
