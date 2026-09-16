import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  identityServerUrl?: string;
  demoData?: boolean | string;
  eas?: { projectId?: string };
};

function extra(): Extra {
  return (Constants.expoConfig?.extra as Extra | undefined) ?? {};
}

/**
 * Resolution order: the inlined env var first, then app.config's `extra`, then the literal default.
 *
 * The env var has to come first because `Constants.expoConfig` is not populated on web — every
 * getter here silently fell through to its default there, so an `.env` pointing at a LAN IP or an
 * alternate port was quietly ignored and requests went to localhost anyway. `EXPO_PUBLIC_*` is
 * substituted into the bundle at build time by Metro, so it works on every platform. `extra` stays
 * as the second stop because it's what a native build reads when the var isn't set.
 *
 * Referencing `process.env.EXPO_PUBLIC_X` by its full literal name is required — Metro does a static
 * text substitution, so a computed lookup like `process.env[name]` resolves to nothing.
 */
function resolve(envValue: string | undefined, configured: string | undefined, fallback: string): string {
  return envValue || configured || fallback;
}

/** The API gateway, which fronts the four resource services (ServiceCatalog, ProviderRegistry,
 * ServiceRequestOrchestrator, Consumers) behind one origin. IdentityServer is not behind it — see
 * getIdentityServerUrl. */
export function getApiUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_API_URL, extra().apiUrl, "http://localhost:5070");
}

export function getOrchestratorUrl(): string {
  return `${getApiUrl()}/orchestrator`;
}

export function getProviderRegistryUrl(): string {
  return `${getApiUrl()}/registry`;
}

export function getServiceCatalogUrl(): string {
  return `${getApiUrl()}/catalog`;
}

/** IdentityServer is called directly, not through the gateway: OTP request and token issuance are
 * anonymous, and proxying Duende would mean reconfiguring its issuer/forwarded-headers or JWT
 * validation breaks. */
export function getIdentityServerUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL, extra().identityServerUrl, "http://localhost:5066");
}

/** The Expo project `getExpoPushTokenAsync` needs. Empty until `eas init` is run for this app — push
 * registration treats that as "not configured" and no-ops. */
export function getEasProjectId(): string {
  return resolve(process.env.EXPO_PUBLIC_EAS_PROJECT_ID, extra().eas?.projectId, "55ca19d3-346b-4d9d-b9af-e8c569a5a0b9");
}

/** Serves the provider-registry/catalog reads from in-memory fixtures. Off unless asked for. */
export function isDemoEnabled(): boolean {
  const fromEnv = process.env.EXPO_PUBLIC_DEMO_DATA;
  if (fromEnv !== undefined) return fromEnv === "1" || fromEnv === "true";

  const configured = extra().demoData;
  return configured === true || configured === "true" || configured === "1";
}
