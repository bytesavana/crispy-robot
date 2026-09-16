import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge, StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { listProviders } from '@/lib/api/providers'
import { listCategories } from '@/lib/api/catalog'
import type { ProviderDto } from '@/types/dto'

type StatusFilter = 'all' | 'active' | 'inactive'
type KindFilter = 'all' | 'Vendor' | 'Runner'
type VerificationFilter = 'all' | 'Pending' | 'Verified' | 'Rejected'
type ViewMode = 'list' | 'byCategory'

const UNCATEGORIZED = '__uncategorized__'

function ProvidersTable({ providers, navigate }: { providers: ProviderDto[]; navigate: (path: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Fulfillment type</TableHead>
          <TableHead>Verification</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow key={provider.id} className="cursor-pointer" onClick={() => navigate(`/providers/${provider.id}`)}>
            <TableCell className="font-medium">{provider.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{provider.kind}</Badge>
            </TableCell>
            <TableCell>{provider.fulfillmentType}</TableCell>
            <TableCell>
              <StatusBadge status={provider.verificationStatus} />
            </TableCell>
            <TableCell>
              <ActiveBadge isActive={provider.isActive} />
            </TableCell>
            <TableCell className="text-muted-foreground">{new Date(provider.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
        {providers.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No providers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export function ProvidersListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const {
    data: providers,
    loading,
    error,
  } = useAsync(
    () =>
      listProviders({
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        kind: kindFilter === 'all' ? undefined : kindFilter,
        verificationStatus: verificationFilter === 'all' ? undefined : verificationFilter,
      }),
    [statusFilter, kindFilter, verificationFilter],
  )

  const categories = useAsync(listCategories, [])

  const groupedByCategory = useMemo(() => {
    if (!providers) return null

    const groups = new Map<string, ProviderDto[]>()
    for (const provider of providers) {
      const activeCategoryCodes = provider.coverage.filter((c) => c.isActive).map((c) => c.categoryCode)
      if (activeCategoryCodes.length === 0) {
        groups.set(UNCATEGORIZED, [...(groups.get(UNCATEGORIZED) ?? []), provider])
        continue
      }
      for (const code of new Set(activeCategoryCodes)) {
        groups.set(code, [...(groups.get(code) ?? []), provider])
      }
    }
    return groups
  }, [providers])

  const categoryName = (code: string) => categories.data?.find((c) => c.code === code)?.name ?? code

  const orderedCategoryCodes = useMemo(() => {
    if (!groupedByCategory) return []
    const codes = [...groupedByCategory.keys()].filter((c) => c !== UNCATEGORIZED)
    codes.sort((a, b) => categoryName(a).localeCompare(categoryName(b)))
    if (groupedByCategory.has(UNCATEGORIZED)) codes.push(UNCATEGORIZED)
    return codes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByCategory, categories.data])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Fulfillment partners registered in ProviderRegistry — Vendors fulfill service themselves, Runners are
            the platform's own dispatchable errand-doers.
          </p>
        </div>
        <Button asChild>
          <Link to="/providers/new">
            <Plus className="size-4" /> New provider
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
            <TabsList>
              <TabsTrigger value="all">All kinds</TabsTrigger>
              <TabsTrigger value="Vendor">Vendor</TabsTrigger>
              <TabsTrigger value="Runner">Runner</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as VerificationFilter)}>
            <TabsList>
              <TabsTrigger value="all">Any verification</TabsTrigger>
              <TabsTrigger value="Pending">Pending</TabsTrigger>
              <TabsTrigger value="Verified">Verified</TabsTrigger>
              <TabsTrigger value="Rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="byCategory">By category</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {providers && viewMode === 'list' && <ProvidersTable providers={providers} navigate={navigate} />}

      {providers && viewMode === 'byCategory' && groupedByCategory && (
        <div className="flex flex-col gap-4">
          {orderedCategoryCodes.map((code) => {
            const group = groupedByCategory.get(code)!
            return (
              <Card key={code}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{code === UNCATEGORIZED ? 'No active coverage' : categoryName(code)}</CardTitle>
                  <Badge variant="outline">{group.length}</Badge>
                </CardHeader>
                <CardContent>
                  <ProvidersTable providers={group} navigate={navigate} />
                </CardContent>
              </Card>
            )
          })}
          {orderedCategoryCodes.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No providers found.</p>
          )}
        </div>
      )}
    </div>
  )
}
