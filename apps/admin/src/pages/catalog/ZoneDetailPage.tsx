import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { listZoneServices, lookupZone } from '@/lib/api/catalog'

export function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>()

  const loadZone = useCallback(async () => {
    const zone = await lookupZone({ zoneId: id })
    const services = await listZoneServices({ zoneId: id })
    return { zone, services }
  }, [id])
  const { data, loading, error } = useAsync(loadZone, [id])

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/catalog/zones">
          <ArrowLeft className="size-4" /> Back to zones
        </Link>
      </Button>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {data && (
        <>
          <div>
            <h1 className="font-heading text-2xl font-semibold">{data.zone.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">{data.zone.id}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active services</CardTitle>
            </CardHeader>
            <CardContent>
              {data.services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Base price</TableHead>
                      <TableHead>Base ETA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.services.map((s) => (
                      <TableRow key={s.categoryCode}>
                        <TableCell>{s.categoryName}</TableCell>
                        <TableCell>{s.basePrice}</TableCell>
                        <TableCell>{s.baseEtaMinutes} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No active services offered in this zone.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
