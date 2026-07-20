import Constants from "expo-constants";

export function getAgentApiUrl(): string {
  const extra = Constants.expoConfig?.extra as { agentApiUrl?: string } | undefined;
  return extra?.agentApiUrl ?? "http://localhost:8000";
}
