export const queryKeys = {
  jobs: (providerId: string) => ["jobs", providerId] as const,
  task: (taskId: string) => ["task", taskId] as const,
  coverage: (providerId: string) => ["coverage", providerId] as const,
  categories: () => ["categories"] as const,
};
