import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge, StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { listProviders } from '@/lib/api/providers'

type Filter = 'all' | 'active' | 'inactive'

export function ProvidersListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const {
    data: providers,
    loading,
    error,
  } = useAsync(() => listProviders(filter === 'all' ? {} : { isActive: filter === 'active' }), [filter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Providers</h1>
          <p className="text-sm text-muted-foreground">Fulfillment partners registered in ProviderRegistry.</p>
        </div>
        <Button asChild>
          <Link to="/providers/new">
            <Plus className="size-4" /> New provider
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {providers && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Fulfillment type</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow
                key={provider.id}
                className="cursor-pointer"
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>{provider.fulfillmentType}</TableCell>
                <TableCell>
                  <StatusBadge status={provider.verificationStatus} />
                </TableCell>
                <TableCell>
                  <ActiveBadge isActive={provider.isActive} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(provider.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {providers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No providers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
