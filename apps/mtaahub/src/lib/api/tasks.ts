import { getOrchestratorUrl } from "../config";
import {
  demoAcceptTaskOffer,
  demoCompleteTask,
  demoGetTask,
  demoListVendorOffers,
  demoListVendorTasks,
  demoMarkTaskUnfulfillable,
  demoRecordTaskUpdate,
  demoRejectTaskOffer,
  demoReportLine,
  demoStartTask,
  isDemoEnabled,
} from "../demo/demoStore";
import { request } from "../http";
import type { ServiceTask, ServiceTaskLineItem, VendorTaskOffer } from "./types";

/**
 * Work at one store — read by both roles, written by both. A vendor answers offers and reports that
 * it can't fulfil something; a runner reports what a line actually cost. They share this module
 * because they share the entity: a ServiceTask is the store's work whoever is looking at it.
 */

function base(): string {
  return getOrchestratorUrl();
}

export function listVendorOffers(providerId: string): Promise<VendorTaskOffer[]> {
  if (isDemoEnabled()) return demoListVendorOffers();
  return request<VendorTaskOffer[]>(base(), "/vendor/offers", { query: { providerId } });
}

export function listVendorTasks(providerId: string, scope: "active" | "history"): Promise<ServiceTask[]> {
  if (isDemoEnabled()) return demoListVendorTasks(scope);
  return request<ServiceTask[]>(base(), "/vendor/tasks", { query: { providerId, scope } });
}

export function getTask(taskId: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoGetTask(taskId);
  return request<ServiceTask>(base(), `/vendor/tasks/${taskId}`);
}

export function acceptTaskOffer(taskId: string, offerId: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoAcceptTaskOffer(taskId);
  return request<ServiceTask>(base(), "/requests/tasks/offers/accept", { method: "POST", body: { taskId, offerId } });
}

/** Declining a store the *customer* named makes the stop Unfulfillable rather than silently
 * substituting — that branch is the backend's, but it's why a rejection reason is worth capturing. */
export function rejectTaskOffer(taskId: string, offerId: string, reason?: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoRejectTaskOffer(taskId);
  return request<ServiceTask>(base(), "/requests/tasks/offers/reject", {
    method: "POST",
    body: { taskId, offerId, reason: reason ?? null },
  });
}

/** This job can't be done. Terminal for the task. */
export function markTaskUnfulfillable(taskId: string, reason?: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoMarkTaskUnfulfillable(taskId);
  return request<ServiceTask>(base(), "/requests/tasks/unfulfillable", {
    method: "POST",
    body: { taskId, serviceRequestId: null, agentRef: null, reason: reason ?? null },
  });
}

/**
 * Moves a job from "confirmed" into "in progress". In demo mode this really flips
 * ServiceTaskStatus; against the real backend it doesn't — `Shopping` is only reached through a Run
 * starting, and a single-appointment job (an ironing order, a house-cleaning visit) never forms one.
 * Rather than call an endpoint that needs a customerId this app doesn't have, this posts a narrative
 * update (safe, already provider-facing) and lets the caller track "in progress" locally — see
 * src/lib/jobProgress.ts, which is the actual source of truth for these jobs' stage in real mode.
 */
export async function startTask(taskId: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoStartTask(taskId);
  await recordTaskUpdate(taskId, "job_started", "Started the job.");
  return getTask(taskId);
}

/** Same real/demo split as startTask — see its comment. */
export async function completeTask(taskId: string): Promise<ServiceTask> {
  if (isDemoEnabled()) return demoCompleteTask(taskId);
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
  if (isDemoEnabled()) {
    return demoReportLine(input.taskId, input.lineItemId, input.actualUnitPrice, input.actualQuantity);
  }
  return request<ServiceTaskLineItem>(base(), "/requests/tasks/lines/report", {
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
  if (isDemoEnabled()) return demoRecordTaskUpdate();
  return request(base(), "/requests/tasks/updates", {
    method: "POST",
    body: { taskId, kind: "Activity", activityType, message },
  });
}
