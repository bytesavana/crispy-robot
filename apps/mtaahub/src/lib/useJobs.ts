import { useCallback } from "react";

import { listVendorOffers, listVendorTasks } from "./api/tasks";
import { fromOffer, fromTask, type Job } from "./jobs";
import { getJobStage } from "./jobProgress";
import { usePolling, type PollingResult } from "./usePolling";

/**
 * Everything Calendar and Earnings both need: live offers, jobs still being worked, and enough
 * history to show "recent errands" and compute this week's earnings. One combined fetch rather than
 * each screen doing its own, so the two screens can never show a job in two different states because
 * they polled a half-second apart.
 */
async function fetchAllJobs(providerId: string): Promise<Job[]> {
  const [offers, active, history] = await Promise.all([
    listVendorOffers(providerId),
    listVendorTasks(providerId, "active"),
    listVendorTasks(providerId, "history"),
  ]);

  const offeredTaskIds = new Set(offers.map((o) => o.taskId));
  const activeTasks = active.filter((t) => !offeredTaskIds.has(t.id));

  const activeJobs = await Promise.all(
    activeTasks.map(async (task) => fromTask(task, ((await getJobStage(task.id)) ?? 0) > 0)),
  );

  return [...offers.map(fromOffer), ...activeJobs, ...history.map((task) => fromTask(task, false))];
}

export function useJobs(providerId: string | undefined): PollingResult<Job[]> {
  const fetcher = useCallback(async (): Promise<Job[]> => {
    if (!providerId) return [];
    return fetchAllJobs(providerId);
  }, [providerId]);

  return usePolling(fetcher, 20_000);
}
