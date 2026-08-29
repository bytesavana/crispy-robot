import Constants from "expo-constants";

type Extra = {
  orchestratorUrl?: string;
  providerRegistryUrl?: string;
  serviceCatalogUrl?: string;
  identityServerUrl?: string;
  demoData?: boolean | string;
  providerId?: string;
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

export function getOrchestratorUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_ORCHESTRATOR_URL, extra().orchestratorUrl, "http://localhost:5063");
}

export function getProviderRegistryUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_PROVIDER_REGISTRY_URL, extra().providerRegistryUrl, "http://localhost:5064");
}

export function getServiceCatalogUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_SERVICE_CATALOG_URL, extra().serviceCatalogUrl, "http://localhost:5062");
}

export function getIdentityServerUrl(): string {
  return resolve(process.env.EXPO_PUBLIC_IDENTITY_SERVER_URL, extra().identityServerUrl, "http://localhost:5066");
}

/**
 * A fixed provider id to run as, skipping the IdentityServer sign-in and ProviderRegistry lookup.
 * For local development against the orchestrator's seeded fixtures — see effective-happiness's
 * DevDataSeeder, which stamps its jobs with this same id. Empty when a real session is expected.
 */
export function getProviderId(): string | undefined {
  return process.env.EXPO_PUBLIC_PROVIDER_ID || extra().providerId || undefined;
}

/** Serves the provider-registry/catalog reads from in-memory fixtures. Off unless asked for. */
export function isDemoEnabled(): boolean {
  const fromEnv = process.env.EXPO_PUBLIC_DEMO_DATA;
  if (fromEnv !== undefined) return fromEnv === "1" || fromEnv === "true";

  const configured = extra().demoData;
  return configured === true || configured === "true" || configured === "1";
}
