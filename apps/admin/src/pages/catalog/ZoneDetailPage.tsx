import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { listZoneServices, lookupZone } from '@/lib/api/catalog'
import { matchProviders } from '@/lib/api/providers'
import type { MatchedProviderDto } from '@/types/dto'

interface ZoneProvider {
  provider: MatchedProviderDto
  categoryNames: string[]
}

async function loadZoneDetail(id?: string) {
  const zone = await lookupZone({ zoneId: id })
  const services = await listZoneServices({ zoneId: id })

  const matchesByCategory = await Promise.all(
    services.map((s) => matchProviders({ zoneId: zone.id, categoryCode: s.categoryCode })),
  )

  const providersById = new Map<string, ZoneProvider>()
  matchesByCategory.forEach((matches, i) => {
    for (const provider of matches) {
      const entry = providersById.get(provider.providerId)
      if (entry) {
        entry.categoryNames.push(services[i].categoryName)
      } else {
        providersById.set(provider.providerId, { provider, categoryNames: [services[i].categoryName] })
      }
    }
  })
  const providers = [...providersById.values()].sort((a, b) => a.provider.name.localeCompare(b.provider.name))

  return { zone, services, providers }
}

export function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, loading, error } = useAsync(useCallback(() => loadZoneDetail(id), [id]), [id])

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
          <h1 className="font-heading text-2xl font-semibold">{data.zone.name}</h1>

          <Card>
            <CardHeader>
              <CardTitle>Active services</CardTitle>
            </CardHeader>
            <CardContent>
              {data.services.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.services.map((s) => (
                    <Link
                      key={s.categoryCode}
                      to={`/catalog/categories/${s.categoryCode}`}
                      className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <p className="font-medium">{s.categoryName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">KSh {s.basePrice.toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="size-3.5" /> {s.baseEtaMinutes} min
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active services offered in this zone.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Providers</CardTitle>
            </CardHeader>
            <CardContent>
              {data.providers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Fulfillment type</TableHead>
                      <TableHead>Covers</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.providers.map(({ provider, categoryNames }) => {
                      const primaryChannel =
                        provider.contactChannels.find((c) => c.isPrimary) ?? provider.contactChannels[0]
                      return (
                        <TableRow
                          key={provider.providerId}
                          className="cursor-pointer"
                          onClick={() => navigate(`/providers/${provider.providerId}`)}
                        >
                          <TableCell className="font-medium">{provider.name}</TableCell>
                          <TableCell>{provider.fulfillmentType}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {categoryNames.map((name) => (
                                <Badge key={name} variant="outline">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {primaryChannel ? `${primaryChannel.type}: ${primaryChannel.value}` : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No providers cover this zone yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
