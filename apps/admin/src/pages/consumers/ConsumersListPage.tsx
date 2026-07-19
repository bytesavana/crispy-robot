import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { listConsumers } from '@/lib/api/consumers'

type Filter = 'all' | 'active' | 'inactive'

export function ConsumersListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const {
    data: consumers,
    loading,
    error,
  } = useAsync(() => listConsumers(filter === 'all' ? {} : { isActive: filter === 'active' }), [filter])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Consumers</h1>
        <p className="text-sm text-muted-foreground">Customer accounts registered in the Consumers service.</p>
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

      {consumers && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Default zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumers.map((consumer) => (
              <TableRow
                key={consumer.id}
                className="cursor-pointer"
                onClick={() => navigate(`/consumers/${consumer.id}`)}
              >
                <TableCell className="font-medium">{consumer.fullName}</TableCell>
                <TableCell>{consumer.phone}</TableCell>
                <TableCell>{consumer.email ?? '—'}</TableCell>
                <TableCell>{consumer.defaultZoneName ?? '—'}</TableCell>
                <TableCell>
                  <ActiveBadge isActive={consumer.isActive} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(consumer.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {consumers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No consumers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
