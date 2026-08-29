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
    // MtaaHub reaches the fulfillment/registry/catalog services through the API gateway (one
    // origin); IdentityServer it calls directly. No agent in the loop — a runner reporting a shelf
    // price isn't having a conversation.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5070",
    identityServerUrl: process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL ?? "http://localhost:5066",
    // Serves the provider-registry/catalog reads from in-memory fixtures instead of the network. Off
    // unless explicitly asked for, and the UI says so on every screen while it's on — see src/lib/demo/.
    demoData: process.env.EXPO_PUBLIC_DEMO_DATA === "1" || process.env.EXPO_PUBLIC_DEMO_DATA === "true",
  },
};

export default config;
