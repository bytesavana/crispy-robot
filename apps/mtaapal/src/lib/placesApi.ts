import { getAgentApiUrl } from "./config";

export type PlaceResult = {
  name: string;
  address_text: string;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  const response = await fetch(
    `${getAgentApiUrl()}/places/search?q=${encodeURIComponent(trimmed)}`,
    { signal },
  );
  if (!response.ok) return [];
  return (await response.json()) as PlaceResult[];
}
