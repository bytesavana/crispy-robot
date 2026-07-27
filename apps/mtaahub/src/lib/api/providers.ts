import { getProviderRegistryUrl, isDemoEnabled } from "../config";
import { demoAddCoverage, demoDeactivateCoverage, demoListCoverage, demoSetProviderActive } from "../demo/demoStore";
import { ApiError, request } from "../http";
import type { BusinessType, ContactChannel, Provider, ProviderCoverage, ProviderKind } from "./types";

/**
 * The sign-in hop: IdentityServer's OTP proves a phone number and nothing else, so this turns that
 * number into the Provider whose work the app then shows. Null means "not a provider here", which
 * is a normal outcome for someone who hasn't been through onboarding yet — not an error.
 */
export async function findProviderByPhone(phone: string): Promise<Provider | null> {
  try {
    return await request<Provider>(getProviderRegistryUrl(), "/providers/by-contact", { query: { value: phone } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function getProvider(providerId: string): Promise<Provider> {
  return request<Provider>(getProviderRegistryUrl(), `/providers/${providerId}`);
}

export interface CreateProviderInput {
  name: string;
  kind: ProviderKind;
  businessType: BusinessType;
  phone: string;
}

/** Self-service onboarding: turns a signed-in phone number with no Provider record into a Pending
 * one, scoped to this contact so the next sign-in resolves straight to it. FulfillmentType is
 * always VendorFulfilled here — both onboarding paths describe someone who does their own work
 * ("fulfill your own orders" / "take on jobs by appointment"), never a business that hands off to a
 * platform courier. */
export function createProvider(input: CreateProviderInput): Promise<Provider> {
  const contactChannels: ContactChannel[] = [{ type: "Phone", value: input.phone, isPrimary: true }];
  return request<Provider>(getProviderRegistryUrl(), "/providers", {
    method: "POST",
    body: {
      name: input.name,
      kind: input.kind,
      fulfillmentType: "VendorFulfilled",
      contactChannels,
      metadata: { businessType: input.businessType },
    },
  });
}

export async function setProviderActive(providerId: string, isActive: boolean): Promise<void> {
  if (isDemoEnabled()) return demoSetProviderActive();
  await request(getProviderRegistryUrl(), `/providers/${providerId}/${isActive ? "activate" : "deactivate"}`, {
    method: "POST",
  });
}

export function listCoverage(providerId: string): Promise<ProviderCoverage[]> {
  if (isDemoEnabled()) return demoListCoverage();
  return request<ProviderCoverage[]>(getProviderRegistryUrl(), `/providers/${providerId}/coverage`);
}

export interface AddCoverageResult {
  coverage: ProviderCoverage | null;
  error: string | null;
}

/** ZoneId is left for the backend to resolve from zoneName against ServiceCatalog — the app only
 * ever has a zone by name (from a picker or an existing coverage row), never a raw guid.
 *
 * Unlike every other endpoint here, a rejected coverage add isn't an exception-filter error string —
 * it's a normal `{ coverage: null, error: "..." }` body on a 422, because "Naivas has no zone called
 * that" is an expected outcome, not a server fault. So this bypasses the shared `request()` helper
 * (which would throw on the 422) and reads the structured body directly. */
export async function addCoverage(providerId: string, zoneName: string, categoryCode: string): Promise<AddCoverageResult> {
  if (isDemoEnabled()) return demoAddCoverage(zoneName, categoryCode);

  const response = await fetch(`${getProviderRegistryUrl()}/providers/${providerId}/coverage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zoneId: null, zoneName, categoryCode }),
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as { coverage: ProviderCoverage | null; error: string | null }) : { coverage: null, error: null };
  return { coverage: body.coverage, error: body.error };
}

export function deactivateCoverage(providerId: string, coverageId: string): Promise<ProviderCoverage> {
  if (isDemoEnabled()) return demoDeactivateCoverage(coverageId);
  return request<ProviderCoverage>(getProviderRegistryUrl(), `/providers/${providerId}/coverage/${coverageId}/deactivate`, {
    method: "POST",
  });
}
