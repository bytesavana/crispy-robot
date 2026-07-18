import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MtaaPal",
  slug: "mtaapal",
  owner: "byte-savana",
  scheme: "mtaapal",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.mtaapal.app",
  },
  android: {
    package: "com.mtaapal.app",
    googleServicesFile: "./google-services.json",
  },
  plugins: ["expo-router", "expo-location", "expo-font", "expo-secure-store", "expo-notifications"],
  extra: {
    agentApiUrl: process.env.EXPO_PUBLIC_AGENT_API_URL ?? "http://localhost:8000",
    identityServerUrl: process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL ?? "http://localhost:5066",
    eas: {
      projectId: "7b657ba4-d063-41c8-9514-bc296ae69956",
    },
  },
};

export default config;
