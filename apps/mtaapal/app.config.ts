import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MtaaPal",
  slug: "mtaapal",
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
  },
  plugins: ["expo-router", "expo-location", "expo-font", "expo-secure-store"],
  extra: {
    agentApiUrl: process.env.EXPO_PUBLIC_AGENT_API_URL ?? "http://localhost:8000",
    identityServerUrl: process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL ?? "http://localhost:5066",
  },
};

export default config;
