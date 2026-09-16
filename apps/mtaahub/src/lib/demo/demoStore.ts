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

const DEMO_ZONE = "Lifestyle Heights, Tatu City";

function demoRow(
  suffix: string,
  categoryCode: string,
  isActive: boolean,
  status: ProviderCoverage["status"],
  reviewNote: string | null = null,
): ProviderCoverage {
  return {
    id: `d0000000-0000-4000-8000-00000000c${suffix}`,
    zoneId: "z1",
    zoneName: DEMO_ZONE,
    categoryCode,
    isActive,
    status,
    requestedAt: "2026-01-01T08:00:00Z",
    reviewedAt: status === "Pending" ? null : "2026-01-02T08:00:00Z",
    reviewedBy: status === "Pending" ? null : "ops",
    reviewNote,
  };
}

let coverage: ProviderCoverage[] | null = null;

function coverageStore(): ProviderCoverage[] {
  return (coverage ??= [
    demoRow("001", "laundry_pickup", true, "Approved"),
    demoRow("002", "ironing", true, "Approved"),
    demoRow("003", "errand_running", false, "Pending"),
    demoRow("004", "house_cleaning", false, "Rejected", "Send a photo ID to finish signup"),
  ]);
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
  const created = demoRow(String(store.length + 1).padStart(3, "0"), categoryCode, true, "Pending");
  created.zoneName = zoneName;
  store.push(created);
  return settle({ coverage: created, error: null });
}

export function demoDeactivateCoverage(coverageId: string): Promise<ProviderCoverage> {
  const found = coverageStore().find((c) => c.id === coverageId);
  if (!found) throw new Error("That coverage entry no longer exists.");
  found.isActive = false;
  return settle(found);
}
