import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Power, PowerOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge, StatusBadge } from '@/components/StatusBadge'
import { ContactChannelsEditor } from '@/components/ContactChannelsEditor'
import { ConfirmActionButton } from '@/components/ConfirmActionButton'
import { TextPromptButton } from '@/components/TextPromptButton'
import { useAsync } from '@/lib/hooks/useAsync'
import { ApiError } from '@/lib/api/client'
import {
  activateProvider,
  addCoverage,
  approveCoverage,
  deactivateCoverage,
  deactivateProvider,
  getProvider,
  listCoverage,
  listOfferings,
  matchProviders,
  rejectCoverage,
  updateProvider,
  verifyProvider,
} from '@/lib/api/providers'
import type { ContactChannelDto, MatchedProviderDto, ProviderKind } from '@/types/dto'

export function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const provider = useAsync(() => getProvider(id!), [id])
  const coverage = useAsync(() => listCoverage(id!), [id])
  const offerings = useAsync(() => listOfferings({ providerId: id! }), [id])

  const [actionError, setActionError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')

  // Edit form state, seeded once the provider loads.
  const [editName, setEditName] = useState<string | null>(null)
  const [editKind, setEditKind] = useState<ProviderKind>('Vendor')
  const [editFulfillmentType, setEditFulfillmentType] = useState('')
  const [editLatitude, setEditLatitude] = useState('')
  const [editLongitude, setEditLongitude] = useState('')
  const [editChannels, setEditChannels] = useState<ContactChannelDto[]>([])
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    if (!provider.data) return
    setEditName(provider.data.name)
    setEditKind(provider.data.kind)
    setEditFulfillmentType(provider.data.fulfillmentType)
    setEditLatitude(provider.data.latitude?.toString() ?? '')
    setEditLongitude(provider.data.longitude?.toString() ?? '')
    setEditChannels(provider.data.contactChannels)
  }, [provider.data])

  const [verifyStatus, setVerifyStatus] = useState('Verified')
  const [showAdvancedVerify, setShowAdvancedVerify] = useState(false)

  const [coverageZoneName, setCoverageZoneName] = useState('')
  const [coverageCategory, setCoverageCategory] = useState('')
  const [coverageError, setCoverageError] = useState<string | null>(null)
  const [coverageSubmitting, setCoverageSubmitting] = useState(false)

  const [matchZoneId, setMatchZoneId] = useState('')
  const [matchCategory, setMatchCategory] = useState('')
  const [matchResults, setMatchResults] = useState<MatchedProviderDto[] | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setEditSubmitting(true)
    setActionError(null)
    try {
      await updateProvider(id, {
        name: editName ?? '',
        kind: editKind,
        fulfillmentType: editFulfillmentType,
        contactChannels: editChannels,
        latitude: editLatitude ? Number(editLatitude) : undefined,
        longitude: editLongitude ? Number(editLongitude) : undefined,
      })
      provider.refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update provider.')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function setVerification(status: string, reason?: string) {
    if (!id) return
    try {
      await verifyProvider(id, { status, reason: reason || null })
      provider.refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update verification status.')
    }
  }

  async function handleAddCoverage(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setCoverageSubmitting(true)
    setCoverageError(null)
    try {
      const result = await addCoverage(id, { zoneName: coverageZoneName, categoryCode: coverageCategory })
      if (result.error) {
        setCoverageError(result.error)
      } else {
        setCoverageZoneName('')
        setCoverageCategory('')
        coverage.refetch()
      }
    } catch (err) {
      setCoverageError(err instanceof ApiError ? err.message : 'Failed to add coverage.')
    } finally {
      setCoverageSubmitting(false)
    }
  }

  async function handleMatchTest(event: FormEvent) {
    event.preventDefault()
    setMatchLoading(true)
    setMatchError(null)
    setMatchResults(null)
    try {
      setMatchResults(await matchProviders({ zoneId: matchZoneId, categoryCode: matchCategory }))
    } catch (err) {
      setMatchError(err instanceof ApiError ? err.message : 'Failed to run match test.')
    } finally {
      setMatchLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/providers">
          <ArrowLeft className="size-4" /> Back to providers
        </Link>
      </Button>

      {provider.error && <ErrorAlert message={provider.error} />}
      {provider.loading && <Skeleton className="h-40 w-full" />}
      {actionError && <ErrorAlert message={actionError} />}

      {provider.data && (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-semibold">{provider.data.name}</h1>
                  <Badge variant="secondary">{provider.data.kind}</Badge>
                  <ActiveBadge isActive={provider.data.isActive} />
                  <StatusBadge status={provider.data.verificationStatus} />
                </div>
                <p className="text-sm text-muted-foreground">{provider.data.fulfillmentType}</p>
                {provider.data.verificationReviewedBy && (
                  <p className="text-xs text-muted-foreground">
                    {provider.data.verificationStatus} by {provider.data.verificationReviewedBy}
                    {provider.data.verificationReviewedAt &&
                      ` · ${new Date(provider.data.verificationReviewedAt).toLocaleString()}`}
                    {provider.data.verificationNote && ` · "${provider.data.verificationNote}"`}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ConfirmActionButton
                  label="Approve"
                  title="Approve provider"
                  description={`"${provider.data.name}" becomes verified.`}
                  variant="default"
                  icon={<Check className="size-4" />}
                  onConfirm={() => setVerification('Verified')}
                />
                <TextPromptButton
                  label="Reject"
                  title="Reject provider"
                  fieldLabel="Reason"
                  placeholder="Shown to the applicant"
                  variant="destructive"
                  onSubmit={(reason) => setVerification('Rejected', reason)}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdvancedVerify((v) => !v)}>
                  Advanced
                </Button>
                {showAdvancedVerify && (
                  <>
                    <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="outline" onClick={() => setVerification(verifyStatus)}>
                      Set status
                    </Button>
                  </>
                )}
                {provider.data.isActive ? (
                  <ConfirmActionButton
                    label="Deactivate"
                    title="Deactivate provider"
                    description={`"${provider.data.name}" will stop receiving new task offers.`}
                    icon={<PowerOff className="size-4" />}
                    onConfirm={async () => {
                      await deactivateProvider(id!)
                      provider.refetch()
                    }}
                  />
                ) : (
                  <ConfirmActionButton
                    label="Activate"
                    title="Activate provider"
                    description={`"${provider.data.name}" will start receiving task offers again.`}
                    icon={<Power className="size-4" />}
                    onConfirm={async () => {
                      await activateProvider(id!)
                      provider.refetch()
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="coverage">Coverage{coverage.data ? ` (${coverage.data.length})` : ''}</TabsTrigger>
              <TabsTrigger value="offerings">Offerings{offerings.data ? ` (${offerings.data.length})` : ''}</TabsTrigger>
              <TabsTrigger value="match">Match test</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Edit details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="editName">Name</Label>
                        <Input id="editName" value={editName ?? ''} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="editKind">Kind</Label>
                        <Select value={editKind} onValueChange={(v) => setEditKind(v as ProviderKind)}>
                          <SelectTrigger id="editKind">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vendor">Vendor</SelectItem>
                            <SelectItem value="Runner">Runner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="editFulfillmentType">Fulfillment type</Label>
                      <Input
                        id="editFulfillmentType"
                        value={editFulfillmentType}
                        onChange={(e) => setEditFulfillmentType(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="editLatitude">Latitude</Label>
                        <Input
                          id="editLatitude"
                          value={editLatitude}
                          onChange={(e) => setEditLatitude(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="editLongitude">Longitude</Label>
                        <Input
                          id="editLongitude"
                          value={editLongitude}
                          onChange={(e) => setEditLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Contact channels</Label>
                      <ContactChannelsEditor channels={editChannels} onChange={setEditChannels} />
                    </div>
                    <Button type="submit" className="w-fit" disabled={editSubmitting}>
                      {editSubmitting ? 'Saving…' : 'Save changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {coverage.error && <ErrorAlert message={coverage.error} />}
                  {coverage.loading && <Skeleton className="h-24 w-full" />}
                  {coverage.data && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zone</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Review</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coverage.data.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.zoneName}</TableCell>
                            <TableCell className="font-mono text-xs">{c.categoryCode}</TableCell>
                            <TableCell>
                              <StatusBadge status={c.status} />
                              {c.reviewNote && (
                                <span className="ml-2 text-xs text-muted-foreground">{c.reviewNote}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <ActiveBadge isActive={c.isActive} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {c.status === 'Pending' && (
                                  <>
                                    <ConfirmActionButton
                                      label="Approve"
                                      title="Approve coverage"
                                      description={`Provider becomes matchable for ${c.categoryCode} in ${c.zoneName}.`}
                                      variant="default"
                                      onConfirm={async () => {
                                        await approveCoverage(id!, c.id)
                                        coverage.refetch()
                                      }}
                                    />
                                    <TextPromptButton
                                      label="Reject"
                                      title="Reject coverage"
                                      fieldLabel="Reason"
                                      variant="destructive"
                                      onSubmit={async (reason) => {
                                        await rejectCoverage(id!, c.id, { reason: reason || null })
                                        coverage.refetch()
                                      }}
                                    />
                                  </>
                                )}
                                {c.isActive && (
                                  <ConfirmActionButton
                                    label="Deactivate"
                                    title="Deactivate coverage"
                                    description={`Provider will stop being matched for ${c.categoryCode} in ${c.zoneName}.`}
                                    onConfirm={async () => {
                                      await deactivateCoverage(id!, c.id)
                                      coverage.refetch()
                                    }}
                                  />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {coverage.data.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No coverage configured.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  <form className="flex items-end gap-2" onSubmit={handleAddCoverage}>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="coverageZone">Zone name</Label>
                      <Input
                        id="coverageZone"
                        value={coverageZoneName}
                        onChange={(e) => setCoverageZoneName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="coverageCategory">Category code</Label>
                      <Input
                        id="coverageCategory"
                        value={coverageCategory}
                        onChange={(e) => setCoverageCategory(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={coverageSubmitting}>
                      Add coverage
                    </Button>
                  </form>
                  {coverageError && <ErrorAlert message={coverageError} />}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offerings">
              <Card>
                <CardHeader>
                  <CardTitle>Offerings</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    This vendor's priced, orderable products from ServiceCatalog's curated catalog — pulled
                    specifically for provider {provider.data.name} via <code>GET /providers/items?providerId=</code>.
                  </p>
                  {offerings.error && <ErrorAlert message={offerings.error} />}
                  {offerings.loading && <Skeleton className="h-24 w-full" />}
                  {offerings.data && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Available</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offerings.data.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">{o.displayName}</TableCell>
                            <TableCell>{o.categoryCode}</TableCell>
                            <TableCell>{o.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <ActiveBadge isActive={o.isAvailable} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {offerings.data.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No offerings for this provider.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="match">
              <Card>
                <CardHeader>
                  <CardTitle>Match test</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Diagnostic: check which providers would be matched for a given zone + category.
                  </p>
                  <form className="flex items-end gap-2" onSubmit={handleMatchTest}>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="matchZoneId">Zone ID</Label>
                      <Input
                        id="matchZoneId"
                        value={matchZoneId}
                        onChange={(e) => setMatchZoneId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="matchCategory">Category code</Label>
                      <Input
                        id="matchCategory"
                        value={matchCategory}
                        onChange={(e) => setMatchCategory(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={matchLoading}>
                      {matchLoading ? 'Testing…' : 'Run match test'}
                    </Button>
                  </form>
                  {matchError && <ErrorAlert message={matchError} />}
                  {matchResults && (
                    <ul className="flex flex-col gap-1 text-sm">
                      {matchResults.map((m) => (
                        <li key={m.providerId}>
                          {m.name} <span className="text-muted-foreground">({m.fulfillmentType})</span>
                        </li>
                      ))}
                      {matchResults.length === 0 && <li className="text-muted-foreground">No matches.</li>}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
