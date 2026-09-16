import type { BusinessType, ServiceTask, VendorTaskOffer } from "./api/types";
import type { StatusTone } from "@/theme";

/**
 * The one shape every screen renders: Calendar, Earnings and Job Detail all show the same job, just
 * with different fields emphasised. It wraps a real ServiceTask (and, while pending, the
 * VendorTaskOffer offering it) rather than replacing it — `raw` carries the whole DTO through for
 * the detail screen and for any real write call, which all key off the task/offer ids.
 *
 * `customerName` has no first-class field on ServiceTaskDto (a store has no customer context by
 * design); it rides along in `fieldValues.customer_name` when the orchestrator has one, and the UI
 * omits the row rather than showing a placeholder when it doesn't.
 */
export interface Job {
  taskId: string;
  offerId: string | null;
  title: string;
  customerName: string | null;
  zoneName: string;
  /** The clock the offer must be answered against. Null once it's no longer an offer. */
  expiresAt: string | null;
  scheduledAt: string;
  price: number;
  status: JobStatus;
  raw: ServiceTask;
}

/** The lifecycle as a business owner or runner actually talks about it — collapsing TaskStatus,
 * "is there a pending offer", and the local start/in-progress flag (see jobProgress.ts) into the one
 * question every screen asks: what do I need to do about this job right now? */
export type JobStatus = "new" | "confirmed" | "inProgress" | "completed" | "cancelled";

const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  new: "new",
  confirmed: "confirmed",
  inProgress: "inProgress",
  completed: "completed",
  cancelled: "failed",
};

export function jobStatusTone(status: JobStatus): StatusTone {
  return JOB_STATUS_TONE[status];
}

/** "Confirmed" is shop language ("I've confirmed I'll do this"); "Accepted" is runner language
 * ("I've accepted this job"). Same status, the word a Shop-or-Vendor and an Independent Runner each
 * reach for first. */
export function jobStatusLabel(status: JobStatus, businessType: BusinessType): string {
  switch (status) {
    case "new":
      return "New request";
    case "confirmed":
      return businessType === "runner" ? "Accepted" : "Confirmed";
    case "inProgress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function toJobStatus(task: ServiceTask, hasPendingOffer: boolean, isLocallyStarted: boolean): JobStatus {
  // hasPendingOffer alone isn't enough on the detail screen: it's set from a route param that
  // doesn't get cleared the moment the offer is answered, so it has to be corroborated against the
  // task's own status — once accept/reject has moved it past Planned/AwaitingVendor, a stale
  // offerId shouldn't keep pinning the screen on "new".
  if (hasPendingOffer && (task.status === "Planned" || task.status === "AwaitingVendor")) return "new";
  if (task.status === "Completed") return "completed";
  if (task.status === "Unfulfillable" || task.status === "Cancelled") return "cancelled";
  if (task.status === "Shopping" || isLocallyStarted) return "inProgress";
  return "confirmed";
}

/** Category codes are snake_case on the wire ("house_cleaning") with no display name in the DTO —
 * the catalog owns that, and fetching one per row to title-case a string isn't worth a round trip. */
export function formatJobTitle(taskCode: string): string {
  return taskCode
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function customerNameFor(task: ServiceTask): string | null {
  return task.fieldValues?.customer_name ?? null;
}

export function fromOffer(offer: VendorTaskOffer): Job {
  return {
    taskId: offer.task.id,
    offerId: offer.offerId,
    title: formatJobTitle(offer.task.taskCode),
    customerName: customerNameFor(offer.task),
    zoneName: offer.task.zoneName,
    expiresAt: offer.expiresAt,
    scheduledAt: offer.task.createdAt,
    price: offer.task.estimatedPrice,
    status: "new",
    raw: offer.task,
  };
}

/**
 * `offerId` is passed by the caller (Calendar/Earnings/Offers all navigate to the detail screen with
 * it when the job they're showing has a live offer) rather than looked up here — a bare ServiceTask
 * can't tell you whether an offer is currently pending on it, since offers live in a separate table.
 * expiresAt stays null in this path even when an offer exists (the detail screen would need to fetch
 * the offer itself, not just the task, to know it) — the caller-supplied `offerId` is enough to get
 * the "new request" Accept/Decline state right; the screen just doesn't show a countdown there,
 * which matches the reference design anyway (only the Offers *list* shows one).
 */
export function fromTask(task: ServiceTask, isLocallyStarted: boolean, offerId: string | null = null): Job {
  return {
    taskId: task.id,
    offerId,
    title: formatJobTitle(task.taskCode),
    customerName: customerNameFor(task),
    zoneName: task.zoneName,
    expiresAt: null,
    scheduledAt: task.createdAt,
    price: task.actualTotal ?? task.estimatedPrice,
    status: toJobStatus(task, !!offerId, isLocallyStarted),
    raw: task,
  };
}

/** The label for a job's active middle stage, once it's under way — "Iron the shirts", not a bare
 * "In progress". Derived from the category code since there's no per-job worksheet in the DTO;
 * falls back to something generic for a category this list hasn't seen.</summary> */
const MID_STAGE_LABELS: Record<string, string> = {
  house_cleaning: "Clean the space",
  laundry_pickup: "Wash & dry",
  ironing: "Iron & fold",
  errand_running: "Run the errand",
  car_wash: "Wash the car",
  grocery_pickup: "Shop the list",
};

export function jobMidStageLabel(taskCode: string): string {
  return MID_STAGE_LABELS[taskCode] ?? "Do the job";
}
