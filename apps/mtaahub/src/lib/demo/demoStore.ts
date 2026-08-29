import type { CatalogCategory, ProviderCoverage } from "../api/types";
import { isDemoEnabled } from "../config";

export { isDemoEnabled };

/**
 * What's left of demo mode: the provider-registry and catalog reads (categories, coverage) that
 * still have no backend of their own. Jobs, offers and tasks now come from the orchestrator's
 * `/vendor` surface in every mode — see src/lib/api/tasks.ts.
 */

// A touch of latency so loading and refreshing states are actually observable rather than
// instantaneous — an empty flash is how you ship a broken spinner without noticing.
function settle<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 220));
}

/** Lets a "reset demo data" affordance put the coverage fixtures back to their opening state. */
export function resetDemoState(): void {
  coverage = null;
}

export function demoSetProviderActive(): Promise<void> {
  return settle(undefined);
}

export function demoListCategories(): Promise<CatalogCategory[]> {
  return settle([
    { code: "laundry_pickup", name: "Laundry (Mama Fua)" },
    { code: "ironing", name: "Ironing" },
    { code: "errand_running", name: "Errand running" },
    { code: "house_cleaning", name: "House cleaning" },
  ]);
}

let coverage: ProviderCoverage[] | null = null;

function coverageStore(): ProviderCoverage[] {
  coverage ??= [
    { id: "d0000000-0000-4000-8000-00000000c001", zoneId: "z1", zoneName: "Lifestyle Heights, Tatu City", categoryCode: "laundry_pickup", isActive: true },
    { id: "d0000000-0000-4000-8000-00000000c002", zoneId: "z1", zoneName: "Lifestyle Heights, Tatu City", categoryCode: "ironing", isActive: true },
    { id: "d0000000-0000-4000-8000-00000000c003", zoneId: "z1", zoneName: "Lifestyle Heights, Tatu City", categoryCode: "errand_running", isActive: false },
    { id: "d0000000-0000-4000-8000-00000000c004", zoneId: "z1", zoneName: "Lifestyle Heights, Tatu City", categoryCode: "house_cleaning", isActive: false },
  ];
  return coverage;
}

export function demoListCoverage(): Promise<ProviderCoverage[]> {
  return settle(coverageStore());
}

export function demoAddCoverage(zoneName: string, categoryCode: string): Promise<{ coverage: ProviderCoverage | null; error: string | null }> {
  const store = coverageStore();
  const existing = store.find((c) => c.zoneName === zoneName && c.categoryCode === categoryCode);
  if (existing) {
    existing.isActive = true;
    return settle({ coverage: existing, error: null });
  }
  const created: ProviderCoverage = {
    id: `d0000000-0000-4000-8000-00000000c${String(store.length + 1).padStart(3, "0")}`,
    zoneId: "z1",
    zoneName,
    categoryCode,
    isActive: true,
  };
  store.push(created);
  return settle({ coverage: created, error: null });
}

export function demoDeactivateCoverage(coverageId: string): Promise<ProviderCoverage> {
  const found = coverageStore().find((c) => c.id === coverageId);
  if (!found) throw new Error("That coverage entry no longer exists.");
  found.isActive = false;
  return settle(found);
}
