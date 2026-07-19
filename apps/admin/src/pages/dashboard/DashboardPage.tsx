import { Link } from 'react-router-dom'
import { AlertCircle, ShieldCheck, Truck, Users, ListTree, Search, PlusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ErrorAlert'
import { IllustrativeTag } from '@/components/Illustrative'
import { useAsync } from '@/lib/hooks/useAsync'
import { listProviders } from '@/lib/api/providers'
import { listConsumers } from '@/lib/api/consumers'
import { listCategories } from '@/lib/api/catalog'
import {
  mockActivityFiller,
  mockAvgTimeToAssignMinutes,
  mockAvgTimeToCompleteMinutes,
  mockOpsNotes,
  mockRequestsByStatus,
  mockRevenueSeries,
  type MockActivityEntry,
} from '@/mocks/dashboardMocks'

async function loadDashboardData() {
  const [providers, consumers, categories] = await Promise.all([
    listProviders(),
    listConsumers(),
    listCategories(),
  ])
  return { providers, consumers, categories }
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-full bg-secondary p-2 text-secondary-foreground">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data, loading, error } = useAsync(loadDashboardData, [])

  const providers = data?.providers ?? []
  const consumers = data?.consumers ?? []
  const categories = data?.categories ?? []

  const activeProviders = providers.filter((p) => p.isActive).length
  const pendingVerification = providers.filter((p) => p.verificationStatus !== 'Verified').length
  const activeConsumers = consumers.filter((c) => c.isActive).length

  const realActivity: MockActivityEntry[] = []
  const latestProvider = [...providers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const latestConsumer = [...consumers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (latestProvider) {
    realActivity.push({
      id: `provider-${latestProvider.id}`,
      message: `Provider "${latestProvider.name}" registered (${latestProvider.verificationStatus})`,
      timestamp: new Date(latestProvider.createdAt).toLocaleString(),
      source: 'real',
    })
  }
  if (latestConsumer) {
    realActivity.push({
      id: `consumer-${latestConsumer.id}`,
      message: `Consumer "${latestConsumer.fullName}" registered`,
      timestamp: new Date(latestConsumer.createdAt).toLocaleString(),
      source: 'real',
    })
  }
  const activityFeed = [...realActivity, ...mockActivityFiller]

  const maxRevenue = Math.max(...mockRevenueSeries)
  const totalRequests = mockRequestsByStatus.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ops Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live counts come straight from ProviderRegistry, Consumers, and ServiceCatalog. Widgets marked
          &ldquo;Illustrative&rdquo; have no backing endpoint yet.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <StatTile
              icon={Truck}
              label="Active providers"
              value={`${activeProviders} / ${providers.length}`}
            />
            <StatTile
              icon={ShieldCheck}
              label="Pending verification"
              value={String(pendingVerification)}
              hint="VerificationStatus ≠ Verified"
            />
            <StatTile
              icon={Users}
              label="Active consumers"
              value={`${activeConsumers} / ${consumers.length}`}
            />
            <StatTile icon={ListTree} label="Live categories" value={String(categories.length)} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue (weekly)</CardTitle>
            <IllustrativeTag />
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 80" className="h-24 w-full">
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                points={mockRevenueSeries
                  .map((v, i) => `${(i / (mockRevenueSeries.length - 1)) * 300},${80 - (v / maxRevenue) * 70}`)
                  .join(' ')}
              />
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">Last 12 weeks, mock figures.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Requests by status</CardTitle>
            <IllustrativeTag />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mockRequestsByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground">{s.status}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${s.color}`} style={{ width: `${(s.count / totalRequests) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatTile
          icon={AlertCircle}
          label="Avg. time to assign"
          value={`${mockAvgTimeToAssignMinutes} min`}
          hint="Illustrative"
        />
        <StatTile
          icon={AlertCircle}
          label="Avg. time to complete"
          value={`${mockAvgTimeToCompleteMinutes} min`}
          hint="Illustrative"
        />
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <Link to="/providers">
                <ShieldCheck className="size-4" /> Verify a provider
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <Link to="/consumers">
                <Search className="size-4" /> Look up a consumer
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <Link to="/requests/lookup">
                <PlusCircle className="size-4" /> Look up a request
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activityFeed.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <span>{entry.message}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {entry.timestamp}
                  {entry.source === 'mock' && <IllustrativeTag />}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ops notes</CardTitle>
            <IllustrativeTag />
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {mockOpsNotes.map((note) => (
                <li key={note} className="list-inside list-disc">
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
