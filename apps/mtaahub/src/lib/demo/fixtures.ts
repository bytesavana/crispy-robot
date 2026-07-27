import type { ServiceTask, ServiceTaskLineItem, VendorTaskOffer } from "../api/types";

/**
 * Stand-in data for demo mode, shaped to match what the orchestrator actually returns — the point
 * is to exercise the real screens, not prove a mockup layout renders.
 *
 * Scheduled times are relative to when the store is built and pinned to real weekdays (this Monday,
 * Wednesday, ...), so the Calendar's week strip and day grouping work exactly as they would against
 * live data instead of needing their own demo-only code path.
 */

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

function thisWeek(dayOffset: number, hour: number, minute: number): string {
  const date = new Date();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setHours(hour, minute, 0, 0);
  monday.setDate(monday.getDate() + dayOffset);
  return monday.toISOString();
}

const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

export const DEMO_IDS = {
  laundryPickupTask: "d0000000-0000-4000-8000-0000000000a1",
  ironingTask: "d0000000-0000-4000-8000-0000000000a2",
  laundryDropoffTask: "d0000000-0000-4000-8000-0000000000a3",
  houseCleaningTask: "d0000000-0000-4000-8000-0000000000a4",
  errandTask: "d0000000-0000-4000-8000-0000000000a5",
  cleaningInProgressTask: "d0000000-0000-4000-8000-0000000000a6",
  extraOfferTask: "d0000000-0000-4000-8000-0000000000a7",
} as const;

function line(displayName: string, quantity: number, price: number): ServiceTaskLineItem {
  return {
    id: `${displayName}-line`.toLowerCase().replace(/\s+/g, "-"),
    productId: "d0000000-0000-4000-8000-00000000d001",
    offeringId: "d0000000-0000-4000-8000-00000000e001",
    providerId: "d0000000-0000-4000-8000-00000000f001",
    itemFamily: "service",
    displayName,
    brand: null,
    packSize: null,
    quantity,
    quotedUnitPrice: price,
    actualUnitPrice: null,
    actualQuantity: null,
    outcome: "Expected",
    approval: "NotRequired",
    proposedSubstituteProductId: null,
    proposedSubstituteDisplayName: null,
    proposedSubstituteUnitPrice: null,
  };
}

function task(
  id: string,
  taskCode: string,
  zoneName: string,
  price: number,
  scheduledAt: string,
  overrides: Partial<ServiceTask> = {},
): ServiceTask {
  return {
    id,
    taskCode,
    zoneId: "d0000000-0000-4000-8000-00000000f100",
    zoneName,
    providerId: "d0000000-0000-4000-8000-00000000f001",
    providerName: "Lifestyle Heights, Tatu City",
    vendorSelection: "PlatformOptimized",
    fieldValues: {},
    lineItems: [line("Service fee", 1, price)],
    estimatedPrice: price,
    actualTotal: null,
    estimatedEtaMinutes: 30,
    status: "ReadyForPickup",
    assignedVendorRef: null,
    assignedRunnerRef: null,
    createdAt: scheduledAt,
    updatedAt: scheduledAt,
    ...overrides,
  };
}

export interface DemoJobRecord {
  task: ServiceTask;
  customerName: string;
  /** Present only while the job is a live, unanswered offer. */
  offer: { offerId: string; attemptNumber: number; offeredAt: string; expiresAt: string } | null;
}

export function buildDemoJobs(): DemoJobRecord[] {
  return [
    {
      customerName: "Grace M.",
      task: task(DEMO_IDS.laundryPickupTask, "laundry_pickup", "Lifestyle Heights, Tatu City", 800, thisWeek(0, 9, 0), {
        status: "AwaitingVendor",
        lineItems: [line("3 bedroom load, pickup by 10am", 1, 800)],
      }),
      offer: {
        offerId: "d0000000-0000-4000-8000-00000000f401",
        attemptNumber: 1,
        offeredAt: at(-1 * 60_000),
        expiresAt: at(6 * 60_000),
      },
    },
    {
      customerName: "Peter K.",
      task: task(DEMO_IDS.ironingTask, "ironing", "Lifestyle Heights, Tatu City", 400, thisWeek(0, 14, 0), {
        lineItems: [line("12 shirts, deliver same day", 1, 400)],
      }),
      offer: null,
    },
    {
      customerName: "Anne W.",
      task: task(DEMO_IDS.laundryDropoffTask, "laundry_pickup", "Lifestyle Heights, Tatu City", 900, thisWeek(2, 11, 0)),
      offer: null,
    },
    {
      customerName: "Zainab A.",
      task: task(DEMO_IDS.cleaningInProgressTask, "house_cleaning", "Lifestyle Heights, Tatu City", 1500, thisWeek(0, 11, 0), {
        status: "Shopping",
        lineItems: [line("Deep clean before guests arrive", 1, 1500)],
      }),
      offer: null,
    },
    {
      customerName: "Diana K.",
      task: task(DEMO_IDS.houseCleaningTask, "house_cleaning", "Lifestyle Heights, Tatu City", 1500, thisWeek(-3, 10, 0), {
        status: "Completed",
        actualTotal: 1500,
        updatedAt: at(-2 * DAY),
      }),
      offer: null,
    },
    {
      customerName: "Brian O.",
      task: task(DEMO_IDS.errandTask, "errand_running", "Lifestyle Heights, Tatu City", 600, thisWeek(-1, 15, 0), {
        status: "Completed",
        actualTotal: 600,
        updatedAt: at(-4 * DAY),
      }),
      offer: null,
    },
    {
      customerName: "New customer",
      task: task(DEMO_IDS.extraOfferTask, "house_cleaning", "Loft 14, Tatu City", 2500, thisWeek(3, 13, 0), {
        status: "AwaitingVendor",
        lineItems: [line("3hr deep clean", 1, 2500)],
      }),
      offer: {
        offerId: "d0000000-0000-4000-8000-00000000f402",
        attemptNumber: 1,
        offeredAt: at(-30_000),
        expiresAt: at(9 * 60_000),
      },
    },
  ];
}

export function toVendorOffer(record: DemoJobRecord): VendorTaskOffer {
  if (!record.offer) throw new Error("This job has no live offer.");
  return {
    offerId: record.offer.offerId,
    taskId: record.task.id,
    attemptNumber: record.offer.attemptNumber,
    offeredAt: record.offer.offeredAt,
    expiresAt: record.offer.expiresAt,
    task: record.task,
  };
}
