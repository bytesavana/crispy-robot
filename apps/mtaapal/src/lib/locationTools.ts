import type { Tool } from "@ag-ui/client";
import * as Location from "expo-location";

import { requestAddressPick } from "./locationPickerBridge";

/**
 * AG-UI tool declarations the client sends on every run (see agUiClient.ts).
 * The agent binds these alongside its own tools and, per agent/prompts.py's
 * rule 1a, calls one when it needs a location instead of asking the customer
 * to name an area — there is no server-side tool that takes a place name.
 *
 * These have no server-side implementation: the graph's route_after_agent
 * ends the run the moment the model calls either one, and useMtaaPalChat's
 * subscriber (via executeLocationTool) is what actually answers it.
 */
export const LOCATION_TOOLS: Tool[] = [
  {
    name: "resolve_customer_location",
    description:
      "Resolve the customer's current location via device GPS. Returns a point " +
      "(source: gps), or permission_denied if location access isn't granted. On " +
      "permission_denied, fall back to ask_customer_for_address rather than asking " +
      "the customer to type an area name — there is nowhere for that to go.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ask_customer_for_address",
    description:
      "Open the location picker so the customer can choose a saved address or share " +
      "their current location. Resolves with a point, or cancelled if they dismiss " +
      "the picker without choosing.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];

const LOCATION_TOOL_NAMES = new Set(LOCATION_TOOLS.map((t) => t.name));

export function isLocationTool(name: string): boolean {
  return LOCATION_TOOL_NAMES.has(name);
}

export type LocationToolResult =
  | {
      status: "resolved";
      latitude: number;
      longitude: number;
      name?: string;
      source: "gps" | "picker" | "saved_address";
    }
  | { status: "permission_denied" }
  | { status: "cancelled" };

/**
 * Executes a client-side location tool by name. Returns undefined for any name
 * that isn't one of ours — callers use that to distinguish "not a location
 * tool call" from "a location tool call that happened to fail", since the
 * latter still needs a ToolMessage pushed back to the model.
 */
export async function executeLocationTool(name: string): Promise<LocationToolResult | undefined> {
  if (name === "resolve_customer_location") {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: "permission_denied" };
    const position = await Location.getCurrentPositionAsync();
    return {
      status: "resolved",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: "gps",
    };
  }

  if (name === "ask_customer_for_address") {
    const picked = await requestAddressPick();
    if (picked === "cancelled") return { status: "cancelled" };
    return { status: "resolved", ...picked };
  }

  return undefined;
}
