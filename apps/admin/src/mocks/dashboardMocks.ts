// Illustrative-only data for dashboard widgets that have no real backend endpoint
// yet (analytics, revenue, cross-customer request status). Clearly labeled in the UI.

export const mockRevenueSeries = [420, 460, 510, 480, 560, 610, 590, 650, 700, 680, 720, 760]

export const mockRequestsByStatus = [
  { status: 'Pending', count: 12, color: 'bg-chart-5' },
  { status: 'Assigned', count: 18, color: 'bg-chart-2' },
  { status: 'InProgress', count: 24, color: 'bg-chart-1' },
  { status: 'Completed', count: 96, color: 'bg-chart-3' },
  { status: 'Cancelled', count: 7, color: 'bg-destructive' },
]

export const mockAvgTimeToAssignMinutes = 6.4
export const mockAvgTimeToCompleteMinutes = 41

export interface MockActivityEntry {
  id: string
  message: string
  timestamp: string
  source: 'real' | 'mock'
}

export const mockActivityFiller: MockActivityEntry[] = [
  { id: 'm1', message: 'Task #TASK-8821 completed by runner R-114', timestamp: '8 min ago', source: 'mock' },
  { id: 'm2', message: 'Zone "Kilimani" hit peak demand', timestamp: '22 min ago', source: 'mock' },
  { id: 'm3', message: 'Provider offer expired for TASK-8790, reassigning', timestamp: '41 min ago', source: 'mock' },
]

export const mockOpsNotes = [
  'Water refill provider in Westlands short-staffed this week — expect longer ETAs.',
  'New car wash category launching next sprint, coordinate with catalog team.',
  'Follow up with ProviderRegistry team about the missing list-all /requests endpoint.',
]
