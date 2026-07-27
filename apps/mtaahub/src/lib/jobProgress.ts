import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The three-stage checklist a job's detail screen shows once it's under way — arrive, do the work,
 * hand off. Kept client-side and separate from ServiceTaskStatus on purpose: the backend's real
 * status machine only reaches "Shopping" through a Run starting, and these single-appointment jobs
 * (a Mama Fua ironing order, a house-cleaning visit) never form one. Rather than fabricate a
 * ServiceTaskStatus transition the backend doesn't actually support from this app, progress through
 * the three stages is tracked locally and narrated to the customer via the existing task-updates
 * endpoint (see recordTaskUpdate) — real, but additive rather than a status-machine change.
 *
 * Persisted so a runner who force-quits mid-job doesn't lose their place.
 */
export type JobStage = 0 | 1 | 2;

const KEY_PREFIX = "mtaahub.jobStage.";

export async function getJobStage(taskId: string): Promise<JobStage | null> {
  const raw = await AsyncStorage.getItem(KEY_PREFIX + taskId);
  if (raw === null) return null;
  const value = Number(raw);
  return value === 0 || value === 1 || value === 2 ? (value as JobStage) : null;
}

export async function setJobStage(taskId: string, stage: JobStage): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFIX + taskId, String(stage));
}

export async function clearJobStage(taskId: string): Promise<void> {
  await AsyncStorage.removeItem(KEY_PREFIX + taskId);
}
