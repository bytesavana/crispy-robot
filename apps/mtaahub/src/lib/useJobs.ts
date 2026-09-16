import { useQuery } from "@tanstack/react-query";

import { listVendorOffers, listVendorTasks } from "./api/tasks";
import { fromOffer, fromTask, type Job } from "./jobs";
import { getJobStage } from "./jobProgress";
import { queryKeys } from "./queryKeys";
import { useRefetchOnFocus } from "./queryClient";

/**
 * Everything Calendar, Offers and Earnings need in one query, keyed by provider — so the three
 * screens share a cache and can never show a job in two different states because they fetched a
 * half-second apart.
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

export interface JobsResult {
  data: Job[] | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
}

export function useJobs(providerId: string | undefined): JobsResult {
  const query = useQuery({
    queryKey: queryKeys.jobs(providerId ?? ""),
    queryFn: () => fetchAllJobs(providerId!),
    enabled: !!providerId,
    refetchInterval: 20_000,
  });

  useRefetchOnFocus(query.refetch, !!providerId);

  return {
    data: query.data ?? null,
    error: query.error instanceof Error ? query.error.message : null,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    refresh: query.refetch,
  };
}
