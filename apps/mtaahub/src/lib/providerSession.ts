import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { findProviderForCurrentUser } from "./api/providers";
import type { BusinessType, Provider, ProviderKind } from "./api/types";
import { getAccountInfo, signOut as clearTokens } from "./auth";

const SESSION_KEY = "mtaahub.providerSession";

/**
 * Who the signed-in person is *to the platform*, as opposed to who IdentityServer says they are.
 * `businessType` is what the onboarding and profile screens show ("Shop or Vendor" / "Independent
 * Runner") — it's a label the person picked for themselves, kept separately from `kind`
 * (ProviderRegistry's own Vendor/Runner split, which is about dispatch, not self-description).
 */
export interface ProviderSession {
  providerId: string;
  name: string;
  kind: ProviderKind;
  businessType: BusinessType;
  isActive: boolean;
  verificationStatus: Provider["verificationStatus"];
  /** Set when verification is Rejected — the reason ops gave, shown in the pending banner. */
  verificationNote: string | null;
  phone: string;
  /** The zone shown in the Calendar header, if the provider has any active coverage. Best-effort —
   * a provider mid-onboarding may have none yet. */
  primaryZoneName: string | null;
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  shop: "Shop or Vendor",
  runner: "Independent Runner",
};

export function businessTypeLabel(type: BusinessType): string {
  return BUSINESS_TYPE_LABELS[type];
}

/** Metadata is free-form and only exists going forward, so a provider onboarded before this shipped
 * falls back to something sensible derived from Kind rather than showing no label at all. */
function resolveBusinessType(provider: Provider): BusinessType {
  return provider.metadata.businessType ?? (provider.kind === "Runner" ? "runner" : "shop");
}

/** Why there's no session, when there isn't one.
 * - `signedOut` → sign-in.
 * - `needsOnboarding` → the phone is a real account but no Provider exists for it yet: the
 *   self-service onboarding flow (role picker → business info), not an error.
 * - `ready` → the calendar/earnings/profile app. */
export type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "needsOnboarding"; phone: string }
  | { status: "ready"; session: ProviderSession };

function toSession(provider: Provider, phone: string): ProviderSession {
  return {
    providerId: provider.id,
    name: provider.name,
    kind: provider.kind,
    businessType: resolveBusinessType(provider),
    isActive: provider.isActive,
    verificationStatus: provider.verificationStatus,
    verificationNote: provider.verificationNote ?? null,
    phone,
    primaryZoneName: provider.coverage.find((c) => c.isActive && c.status === "Approved")?.zoneName ?? null,
  };
}

/**
 * Resolves the signed-in user to their provider, caching the result. The cache is a launch-speed
 * thing, not a source of truth — it's refreshed from the registry on every resolve, so a runner
 * deactivated overnight finds out on their next cold start rather than never.
 */
export async function resolveProviderSession(): Promise<SessionState> {
  const account = await getAccountInfo();
  if (!account) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { status: "signedOut" };
  }

  try {
    const provider = await findProviderForCurrentUser();
    if (!provider) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { status: "needsOnboarding", phone: account.phone };
    }

    const session = toSession(provider, account.phone);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { status: "ready", session };
  } catch {
    // The registry is unreachable — fall back to the cached session rather than bouncing a runner
    // out to sign-in over a flaky connection mid-shift.
    const cached = await AsyncStorage.getItem(SESSION_KEY);
    if (cached) {
      return { status: "ready", session: JSON.parse(cached) as ProviderSession };
    }
    throw new Error("Couldn't reach the provider registry. Check your connection and try again.");
  }
}

/** Called once onboarding creates the Provider record, so the app can move straight into the
 * calendar without a second network round trip to re-resolve what was just created. */
export async function cacheProviderSession(provider: Provider, phone: string): Promise<ProviderSession> {
  const session = toSession(provider, phone);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Patches the cached session's isActive flag after a real activate/deactivate call succeeds, so the
 * Calendar header's toggle and the Profile badge agree without a full re-resolve. */
export async function updateCachedIsActive(isActive: boolean): Promise<void> {
  const cached = await AsyncStorage.getItem(SESSION_KEY);
  if (!cached) return;
  const session = JSON.parse(cached) as ProviderSession;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, isActive }));
}

export async function signOut(): Promise<void> {
  await clearTokens();
  await AsyncStorage.removeItem(SESSION_KEY);
}

/**
 * Demo-mode only: flips the cached session between Runner and Vendor so both halves of the app can
 * be walked from one account. Real sessions must never do this — `kind` is the platform's statement
 * about what someone is, and a shop that could put itself in runner mode would be offered trips it
 * has no business taking. Returns the kind now in effect.
 */
export async function toggleDemoRole(): Promise<ProviderKind> {
  const cached = await AsyncStorage.getItem(SESSION_KEY);
  if (!cached) throw new Error("No session to switch.");

  const session = JSON.parse(cached) as ProviderSession;
  const kind: ProviderKind = session.kind === "Runner" ? "Vendor" : "Runner";
  const next: ProviderSession = {
    ...session,
    kind,
    businessType: kind === "Runner" ? "runner" : "shop",
    name: kind === "Vendor" ? "Java House Adams (demo)" : "Faith W. — Mama Fua (demo)",
    primaryZoneName: kind === "Vendor" ? "Tatu City" : "Lifestyle Heights, Tatu City",
  };

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return kind;
}

/** The cached session with no network hop, for screens rendering below a resolved root. Null while
 * the read is in flight, which every caller already handles — the root has resolved by then, so
 * this is a one-frame gap rather than a state a screen sits in. */
export function useProviderSession(): ProviderSession | null {
  const [session, setSession] = useState<ProviderSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(SESSION_KEY)
      .then((cached) => {
        if (cancelled) return;
        setSession(cached ? (JSON.parse(cached) as ProviderSession) : null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
