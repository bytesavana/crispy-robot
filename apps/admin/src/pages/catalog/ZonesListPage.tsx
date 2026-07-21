import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { listZones } from '@/lib/api/catalog'

export function ZonesListPage() {
  const navigate = useNavigate()
  const { data: zones, loading, error } = useAsync(listZones, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Zones</h1>
        <p className="text-sm text-muted-foreground">Click a zone to see its offered services.</p>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {zones && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Zone ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow
                key={zone.id}
                className="cursor-pointer"
                onClick={() => navigate(`/catalog/zones/${zone.id}`)}
              >
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{zone.id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
