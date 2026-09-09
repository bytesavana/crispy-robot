import { getOrchestratorUrl } from "../config";
import { request } from "../http";

/**
 * This device's Expo push token, told to (or withdrawn from) the orchestrator against the signed-in
 * provider. Registration is idempotent and moves the token off any previous owner, so it's safe to
 * call on every launch; the DELETE is the sign-out counterpart.
 */

function base(): string {
  return getOrchestratorUrl();
}

export function registerVendorPushToken(providerId: string, token: string): Promise<void> {
  return request(base(), "/vendor/push-tokens", { method: "POST", body: { token }, query: { providerId } });
}

export function unregisterVendorPushToken(providerId: string, token: string): Promise<void> {
  return request(base(), "/vendor/push-tokens", { method: "DELETE", query: { providerId, token } });
}
