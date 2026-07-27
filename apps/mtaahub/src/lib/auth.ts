import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { getIdentityServerUrl } from "./config";

const ACCESS_TOKEN_KEY = "mtaahub.accessToken";
const REFRESH_TOKEN_KEY = "mtaahub.refreshToken";

// expo-secure-store has no web implementation (its web module is an empty stub) — fall back to
// AsyncStorage there. Native platforms keep using the OS keychain via SecureStore.
const tokenStorage =
  Platform.OS === "web"
    ? {
        getItemAsync: (key: string) => AsyncStorage.getItem(key),
        setItemAsync: (key: string, value: string) => AsyncStorage.setItem(key, value),
        deleteItemAsync: (key: string) => AsyncStorage.removeItem(key),
      }
    : SecureStore;

// Its own client id, not MtaaPal's: the two apps are used by different people doing different
// things, and sharing one would mean neither could be revoked or re-scoped without the other.
const CLIENT_ID = "mtaahub-mobile";
const SCOPE = "mtaapal.fulfillment offline_access";

export class AuthError extends Error {}

/**
 * Thrown when the number has no account at all. MtaaHub deliberately has no registration path —
 * providers are onboarded by ops, so this routes to "ask ops to set you up" rather than to a
 * sign-up form. That's the one real difference from MtaaPal's otherwise identical auth flow.
 */
export class NotOnboardedError extends AuthError {}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

export type AccountInfo = { fullName: string; phone: string; email?: string };

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64Decode(input: string): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Reads the access token's claims for display only — this is not a verification step, the token
 * was already validated server-side by whoever accepts it. */
function decodeTokenClaims(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = base64Decode(base64);
    const utf8 = decodeURIComponent(
      Array.from(bytes, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
    );
    return JSON.parse(utf8) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toFormBody(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function postToken(params: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(`${getIdentityServerUrl()}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toFormBody(params),
  });
  if (!response.ok) {
    throw new AuthError("Invalid or expired code");
  }
  return (await response.json()) as TokenResponse;
}

/** Sends a login code. Throws NotOnboardedError if IdentityServer has never heard of the number. */
export async function requestOtp(identifier: string): Promise<void> {
  const response = await fetch(`${getIdentityServerUrl()}/account/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  if (response.status === 404) throw new NotOnboardedError(identifier);
  if (response.status !== 202) throw new AuthError("Couldn't send the code — try again.");
}

export async function verifyLogin(identifier: string, code: string): Promise<void> {
  const tokens = await postToken({ grant_type: "otp", client_id: CLIENT_ID, identifier, code, scope: SCOPE });
  await storeTokens(tokens);
}

export function getAccessToken(): Promise<string | null> {
  return tokenStorage.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const tokens = await postToken({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    });
    await storeTokens(tokens);
    return tokens.access_token;
  } catch {
    await signOut();
    return null;
  }
}

export async function signOut(): Promise<void> {
  await tokenStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
  await tokenStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/** Null when signed out. Reads the signed-in account's display info straight off the access token's
 * claims (full_name/phone/email — added by IdentityServer's profile service). The phone is what
 * resolves this person to a Provider, so it's load-bearing here, not just decoration. */
export async function getAccountInfo(): Promise<AccountInfo | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const claims = decodeTokenClaims(token);
  const fullName = typeof claims?.full_name === "string" ? claims.full_name : undefined;
  const phone = typeof claims?.phone === "string" ? claims.phone : undefined;
  const email = typeof claims?.email === "string" ? claims.email : undefined;
  if (!fullName || !phone) return null;

  return { fullName, phone, email };
}

async function storeTokens(tokens: TokenResponse): Promise<void> {
  await tokenStorage.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
  await tokenStorage.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
}
