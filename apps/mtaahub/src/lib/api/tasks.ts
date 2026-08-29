import { getOrchestratorUrl } from "../config";
import { request } from "../http";
import type { ServiceTask, ServiceTaskLineItem, VendorTaskOffer } from "./types";

/**
 * Work at one store, served by the orchestrator's `/vendor` surface — reads (offers, tasks) and the
 * answers a store gives back (accept/reject an offer, report a line, narrate progress).
 */

function base(): string {
  return getOrchestratorUrl();
}

export function listVendorOffers(providerId: string): Promise<VendorTaskOffer[]> {
  return request<VendorTaskOffer[]>(base(), "/vendor/offers", { query: { providerId } });
}

export function listVendorTasks(providerId: string, scope: "active" | "history"): Promise<ServiceTask[]> {
  return request<ServiceTask[]>(base(), "/vendor/tasks", { query: { providerId, scope } });
}

export function getTask(taskId: string): Promise<ServiceTask> {
  return request<ServiceTask>(base(), `/vendor/tasks/${taskId}`);
}

export function acceptTaskOffer(taskId: string, offerId: string): Promise<ServiceTask> {
  return request<ServiceTask>(base(), "/vendor/offers/accept", { method: "POST", body: { taskId, offerId } });
}

/** Declining a store the *customer* named makes the stop Unfulfillable rather than silently
 * substituting — that branch is the backend's, but it's why a rejection reason is worth capturing. */
export function rejectTaskOffer(taskId: string, offerId: string, reason?: string): Promise<ServiceTask> {
  return request<ServiceTask>(base(), "/vendor/offers/reject", {
    method: "POST",
    body: { taskId, offerId, reason: reason ?? null },
  });
}

/** This job can't be done. Terminal for the task. */
export function markTaskUnfulfillable(taskId: string, reason?: string): Promise<ServiceTask> {
  return request<ServiceTask>(base(), "/vendor/tasks/unfulfillable", {
    method: "POST",
    body: { taskId, reason: reason ?? null },
  });
}

/**
 * Moves a job from "confirmed" into "in progress". The backend doesn't transition status here —
 * `Shopping` is only reached through a Run starting, and a single-appointment job (an ironing order,
 * a house-cleaning visit) never forms one. Rather than call an endpoint that needs a customerId this
 * app doesn't have, this posts a narrative update (safe, already provider-facing) and lets the caller
 * track "in progress" locally — see src/lib/jobProgress.ts, the actual source of truth for stage.
 */
export async function startTask(taskId: string): Promise<ServiceTask> {
  await recordTaskUpdate(taskId, "job_started", "Started the job.");
  return getTask(taskId);
}

/** Same split as startTask — see its comment. */
export async function completeTask(taskId: string): Promise<ServiceTask> {
  await recordTaskUpdate(taskId, "job_completed", "Finished the job.");
  return getTask(taskId);
}

export interface ReportLineInput {
  taskId: string;
  lineItemId: string;
  /** What it actually cost. Inside tolerance it's applied silently; outside, the customer is asked. */
  actualUnitPrice?: number;
  /** How much they could get — zero meaning none at all. */
  actualQuantity?: number;
  /** A proposed swap. Always goes to the customer, however well priced: agreeing to buy Mumias sugar
   * is not agreeing to buy a different brand of sugar. */
  substituteProductId?: string;
  reason?: string;
}

export function reportLineOutcome(input: ReportLineInput): Promise<ServiceTaskLineItem> {
  return request<ServiceTaskLineItem>(base(), "/vendor/tasks/lines/report", {
    method: "POST",
    body: {
      taskId: input.taskId,
      lineItemId: input.lineItemId,
      actualUnitPrice: input.actualUnitPrice ?? null,
      actualQuantity: input.actualQuantity ?? null,
      substituteProductId: input.substituteProductId ?? null,
      reason: input.reason ?? null,
    },
  });
}

/** A narrative update the customer sees in their conversation ("arrived at the market") — not a
 * status transition, which is why it's a separate call from the state-machine endpoints. */
export function recordTaskUpdate(taskId: string, activityType: string, message: string): Promise<unknown> {
  return request(base(), "/vendor/tasks/updates", {
    method: "POST",
    body: { taskId, kind: "Activity", activityType, message },
  });
}
