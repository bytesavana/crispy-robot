import { getAgentApiUrl } from "./config";

export type PlaceResult = {
  name: string;
  address_text: string;
  latitude: number;
  longitude: number;
};

/**
 * Address/place search for the location picker's search box. Backed by
 * GET /places/search on the agent — stubbed on fake data server-side for now
 * (see didactic-invention/clients/places.py), not a real Google Places call
 * yet. No identity header: it's a stateless lookup, same trust level as the
 * old /zones/resolve bootstrap.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const response = await fetch(
    `${getAgentApiUrl()}/places/search?q=${encodeURIComponent(trimmed)}`,
    { signal },
  );
  if (!response.ok) return [];
  return (await response.json()) as PlaceResult[];
}
