import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ApiError } from '@/lib/api/client'
import { listZoneServices, lookupZone, resolveZone } from '@/lib/api/catalog'
import type { ServiceOfferingDto, ZoneDto } from '@/types/dto'

export function ZoneLookupPage() {
  const [zone, setZone] = useState<ZoneDto | null>(null)
  const [services, setServices] = useState<ServiceOfferingDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [zoneName, setZoneName] = useState('')

  async function loadServicesFor(resolved: ZoneDto) {
    setZone(resolved)
    try {
      setServices(await listZoneServices({ zoneId: resolved.id }))
    } catch (err) {
      setServices(null)
      setError(err instanceof ApiError ? err.message : 'Failed to load services for zone.')
    }
  }

  async function handleResolve(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setZone(null)
    setServices(null)
    try {
      const resolved = await resolveZone(Number(lat), Number(lng))
      await loadServicesFor(resolved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resolve zone.')
    }
  }

  async function handleLookup(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setZone(null)
    setServices(null)
    try {
      const resolved = await lookupZone({ zoneName })
      await loadServicesFor(resolved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to look up zone.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Zone lookup</h1>
        <p className="text-sm text-muted-foreground">Resolve a zone by coordinates or by name.</p>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="coords">
            <TabsList>
              <TabsTrigger value="coords">By coordinates</TabsTrigger>
              <TabsTrigger value="name">By name</TabsTrigger>
            </TabsList>
            <TabsContent value="coords">
              <form className="flex items-end gap-3" onSubmit={handleResolve}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.286389" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="36.817223" />
                </div>
                <Button type="submit">Resolve</Button>
              </form>
            </TabsContent>
            <TabsContent value="name">
              <form className="flex items-end gap-3" onSubmit={handleLookup}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="zoneName">Zone name</Label>
                  <Input
                    id="zoneName"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Kilimani"
                  />
                </div>
                <Button type="submit">Look up</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && <ErrorAlert message={error} />}

      {zone && (
        <Card>
          <CardHeader>
            <CardTitle>
              {zone.name} <span className="font-mono text-xs text-muted-foreground">{zone.id}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services && services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Base price</TableHead>
                    <TableHead>Base ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
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
      )}
    </div>
  )
}
