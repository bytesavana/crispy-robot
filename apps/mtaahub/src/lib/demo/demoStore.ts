import type { CatalogCategory, ProviderCoverage, ServiceTask, ServiceTaskLineItem, VendorTaskOffer } from "../api/types";
import { isDemoEnabled } from "../config";
import { buildDemoJobs, toVendorOffer, type DemoJobRecord } from "./fixtures";

export { isDemoEnabled };

/**
 * An in-memory stand-in for the fulfillment backend, so the app can be walked end to end with no
 * services running.
 *
 * It *mutates* rather than just serving static lists: accepting an offer really does move the job
 * onto the calendar as confirmed, reporting unfulfillable really does mark it cancelled. Static
 * fixtures would show that the screens render, which is the least interesting thing to know about
 * them — the flows between screens are where the state machine actually shows up.
 *
 * Deliberately not a fallback for a failing API. If demo mode is on, nothing touches the network at
 * all; if it's off, nothing here runs.
 */

let records: DemoJobRecord[] | null = null;

function store(): DemoJobRecord[] {
  records ??= buildDemoJobs();
  return records;
}

/** Lets a "reset demo data" affordance put the fixtures back to their opening state. */
export function resetDemoState(): void {
  records = null;
  coverage = null;
}

export function getDemoCustomerName(taskId: string): string | null {
  return records?.find((r) => r.task.id === taskId)?.customerName ?? null;
}

// A touch of latency so loading and refreshing states are actually observable rather than
// instantaneous — an empty flash is how you ship a broken spinner without noticing.
function settle<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 220));
}

const nowIso = () => new Date().toISOString();

function findRecord(taskId: string): DemoJobRecord {
  const record = store().find((r) => r.task.id === taskId);
  if (!record) throw new Error("That job no longer exists.");
  return record;
}

export function demoListVendorOffers(): Promise<VendorTaskOffer[]> {
  const now = Date.now();
  const live = store().filter((r) => r.offer && new Date(r.offer.expiresAt).getTime() > now);
  return settle(live.map(toVendorOffer));
}

const ACTIVE_TASK_STATUSES = new Set(["Planned", "AwaitingVendor", "ReadyForPickup", "Shopping"]);

export function demoListVendorTasks(scope: "active" | "history"): Promise<ServiceTask[]> {
  const matching = store()
    .filter((r) => !r.offer)
    .map((r) => r.task)
    .filter((t) => (scope === "active" ? ACTIVE_TASK_STATUSES.has(t.status) : !ACTIVE_TASK_STATUSES.has(t.status)));
  return settle([...matching].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export function demoGetTask(taskId: string): Promise<ServiceTask> {
  return settle(findRecord(taskId).task);
}

export function demoAcceptTaskOffer(taskId: string): Promise<ServiceTask> {
  const record = findRecord(taskId);
  record.task.status = "ReadyForPickup";
  record.task.updatedAt = nowIso();
  record.offer = null;
  return settle(record.task);
}

export function demoRejectTaskOffer(taskId: string): Promise<ServiceTask> {
  const record = findRecord(taskId);
  record.task.status = "Unfulfillable";
  record.task.updatedAt = nowIso();
  record.offer = null;
  return settle(record.task);
}

export function demoMarkTaskUnfulfillable(taskId: string): Promise<ServiceTask> {
  return demoRejectTaskOffer(taskId);
}

export function demoStartTask(taskId: string): Promise<ServiceTask> {
  const record = findRecord(taskId);
  record.task.status = "Shopping";
  record.task.updatedAt = nowIso();
  return settle(record.task);
}

export function demoCompleteTask(taskId: string): Promise<ServiceTask> {
  const record = findRecord(taskId);
  record.task.status = "Completed";
  record.task.actualTotal = record.task.lineItems.reduce(
    (sum, i) => sum + (i.actualUnitPrice ?? i.quotedUnitPrice) * (i.actualQuantity ?? i.quantity),
    0,
  );
  record.task.updatedAt = nowIso();
  return settle(record.task);
}

// ---- Line reporting (kept for grocery-style jobs whose lines carry real prices/quantities) ----

const TOLERANCE_FRACTION = 0.05;
const TOLERANCE_ABSOLUTE = 50;

export function demoReportLine(
  taskId: string,
  lineItemId: string,
  actualUnitPrice?: number,
  actualQuantity?: number,
): Promise<ServiceTaskLineItem> {
  const { task } = findRecord(taskId);
  const item = task.lineItems.find((i) => i.id === lineItemId);
  if (!item) throw new Error("That item isn't on this job.");

  if (actualUnitPrice !== undefined) item.actualUnitPrice = actualUnitPrice;
  if (actualQuantity !== undefined) item.actualQuantity = actualQuantity;

  const quantity = item.actualQuantity ?? item.quantity;
  if (quantity === 0) {
    item.outcome = "NotPurchased";
    item.approval = "NotRequired";
  } else {
    item.outcome = "Purchased";
    // Mirrors ReconciliationSettings: a line passes if it's inside *either* bound, because 5% of a
    // small job is noise while 5% of a large one is very much worth asking about.
    const quoted = item.quotedUnitPrice * item.quantity;
    const actual = (item.actualUnitPrice ?? item.quotedUnitPrice) * quantity;
    const drift = Math.abs(actual - quoted);
    const withinTolerance = drift <= TOLERANCE_ABSOLUTE || drift <= quoted * TOLERANCE_FRACTION;
    item.approval = withinTolerance ? "NotRequired" : "Pending";
  }

  task.updatedAt = nowIso();
  return settle(item);
}

export function demoRecordTaskUpdate(): Promise<void> {
  return settle(undefined);
}

// ---- Provider registry side: availability, categories, coverage ----

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
