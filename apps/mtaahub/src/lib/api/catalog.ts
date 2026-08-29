import { getServiceCatalogUrl, isDemoEnabled } from "../config";
import { demoListCategories } from "../demo/demoStore";
import { request } from "../http";
import type { CatalogCategory, CatalogZone } from "./types";

/** Real category names for the onboarding "what do you offer" chips and the Coverage screen —
 * pulled from ServiceCatalog rather than hardcoded, so a chip always names something the platform
 * actually has a category for. */
export function listCategories(): Promise<CatalogCategory[]> {
  if (isDemoEnabled()) return demoListCategories();
  return request<CatalogCategory[]>(getServiceCatalogUrl(), "/categories");
}

/** Zones a provider can pick to cover during onboarding. Coverage is per zone × category. */
export function listZones(): Promise<CatalogZone[]> {
  if (isDemoEnabled()) return Promise.resolve([{ id: "demo-zone", name: "Lifestyle Heights, Tatu City" }]);
  return request<CatalogZone[]>(getServiceCatalogUrl(), "/zones");
}
