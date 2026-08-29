import { useMemo, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, MessageCircleQuestion, Search, ShoppingCart, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { getAdminRequestDetail } from '@/lib/api/admin'
import { listCategories } from '@/lib/api/catalog'
import { dt, money, text } from '@/lib/format'
import type {
  AdminRunDto,
  AdminServiceTaskDto,
  BasketDto,
  ServiceCategoryDto,
  ServiceCategoryFieldDto,
} from '@/types/dto'

type TimelineEntry =
  | { kind: 'status'; occurredAt: string; fromStatus?: string | null; toStatus: string; reason?: string | null }
  | { kind: 'update'; occurredAt: string; updateKind: string; activityType: string; message: string }
  | { kind: 'offer'; occurredAt: string; providerName: string; attemptNumber: number; status: string }

function buildTimeline(task: AdminServiceTaskDto): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...(task.statusEvents ?? []).map(
      (e): TimelineEntry => ({ kind: 'status', occurredAt: e.occurredAt, fromStatus: e.fromStatus, toStatus: e.toStatus, reason: e.reason }),
    ),
    ...(task.updates ?? []).map(
      (u): TimelineEntry => ({ kind: 'update', occurredAt: u.occurredAt, updateKind: u.kind, activityType: u.activityType, message: u.message }),
    ),
    ...(task.offers ?? []).map(
      (o): TimelineEntry => ({ kind: 'offer', occurredAt: o.offeredAt, providerName: o.providerName, attemptNumber: o.attemptNumber, status: o.status }),
    ),
  ]
  return entries.sort((a, b) => (a.occurredAt ?? '').localeCompare(b.occurredAt ?? ''))
}

const ADDRESS_KEY_PATTERN = /address/i

function splitFieldValues(fieldValues: Record<string, string> | null | undefined) {
  const address: [string, string][] = []
  const other: [string, string][] = []
  for (const entry of Object.entries(fieldValues ?? {})) {
    ;(ADDRESS_KEY_PATTERN.test(entry[0]) ? address : other).push(entry)
  }
  return { address, other }
}

function fieldLabel(fields: ServiceCategoryFieldDto[] | undefined, key: string) {
  return fields?.find((f) => f.key === key)?.label ?? key
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  )
}

function BasketCard({ basket, categoryByCode }: { basket: BasketDto | undefined; categoryByCode: Map<string, ServiceCategoryDto> }) {
  const intents = basket?.intents ?? []
  if (intents.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>What the customer asked for</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {intents.map((intent) => {
          const { address, other } = splitFieldValues(intent.fieldValues)
          const fields = categoryByCode.get(intent.taskCode)?.fields
          return (
            <div key={intent.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="font-medium">{categoryByCode.get(intent.taskCode)?.name ?? intent.taskCode}</p>
                <Badge variant="outline">{text(intent.zoneName)}</Badge>
              </div>
              {(other.length > 0 || address.length > 0) && (
                <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {[...other, ...address].map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{fieldLabel(fields, key)}</dt>
                      <dd>{text(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(intent.items ?? []).length > 0 && (
                <ul className="text-sm text-muted-foreground">
                  {(intent.items ?? []).map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.displayName}
                      {item.brand ? ` · ${item.brand}` : ''}
                      {item.packSize ? ` · ${item.packSize}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function OffersTable({ task }: { task: AdminServiceTaskDto }) {
  const offers = task.offers ?? []
  if (offers.length === 0) {
    return <p className="text-sm text-muted-foreground">No vendor offers — this task was not offered to any store.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Fulfillment</TableHead>
          <TableHead>Offered</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Responded</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offers.map((offer) => (
          <TableRow key={offer.id}>
            <TableCell>{offer.attemptNumber}</TableCell>
            <TableCell className="font-medium">{text(offer.providerName)}</TableCell>
            <TableCell>{text(offer.fulfillmentType)}</TableCell>
            <TableCell className="text-muted-foreground">{dt(offer.offeredAt)}</TableCell>
            <TableCell className="text-muted-foreground">{dt(offer.expiresAt)}</TableCell>
            <TableCell className="text-muted-foreground">{dt(offer.respondedAt)}</TableCell>
            <TableCell>
              <StatusBadge status={offer.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function LineItemsTable({ task }: { task: AdminServiceTaskDto }) {
  const items = task.lineItems ?? []
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShoppingCart className="size-4" /> No cart items on this task.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Pack size</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Quoted</TableHead>
          <TableHead>Actual</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Approval</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{text(item.displayName)}</TableCell>
            <TableCell>{text(item.brand)}</TableCell>
            <TableCell>{text(item.packSize)}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{money(item.quotedUnitPrice)}</TableCell>
            <TableCell>{money(item.actualUnitPrice)}</TableCell>
            <TableCell>{text(item.outcome)}</TableCell>
            <TableCell>{text(item.approval)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TimelineList({ task }: { task: AdminServiceTaskDto }) {
  const timeline = buildTimeline(task)
  if (timeline.length === 0) return <p className="text-sm text-muted-foreground">No history yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {timeline.map((entry, i) => (
        <li key={i} className="flex items-start justify-between gap-3 text-sm">
          {entry.kind === 'status' && (
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">Status</Badge>
              {text(entry.fromStatus) === '—' ? 'created' : entry.fromStatus} → <span className="font-medium">{entry.toStatus}</span>
              {entry.reason && <span className="text-muted-foreground">({entry.reason})</span>}
            </span>
          )}
          {entry.kind === 'update' && (
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge variant={entry.updateKind === 'Question' ? 'destructive' : 'outline'}>
                {entry.updateKind === 'Question' ? <MessageCircleQuestion className="size-3" /> : null}
                {entry.activityType}
              </Badge>
              {entry.message}
            </span>
          )}
          {entry.kind === 'offer' && (
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">Offer</Badge>
              #{entry.attemptNumber} to <span className="font-medium">{entry.providerName}</span>
              <StatusBadge status={entry.status} />
            </span>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">{dt(entry.occurredAt)}</span>
        </li>
      ))}
    </ul>
  )
}

function TaskPanel({ task, category }: { task: AdminServiceTaskDto; category: ServiceCategoryDto | undefined }) {
  const { address, other } = splitFieldValues(task.fieldValues)
  const timeline = buildTimeline(task)
  const offers = task.offers ?? []
  const items = task.lineItems ?? []

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{category?.name ?? task.taskCode}</p>
          <StatusBadge status={task.status} />
          <Badge variant="outline">{text(task.vendorSelection)}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Zone">{text(task.zoneName)}</Field>
          <Field label="Estimated price">{money(task.estimatedPrice)}</Field>
          <Field label="Actual total">{money(task.actualTotal)}</Field>
          <Field label="ETA">{task.estimatedEtaMinutes} min</Field>
          <Field label="Provider">{text(task.providerName)}</Field>
          <Field label="Assigned vendor">{text(task.assignedVendorRef)}</Field>
          <Field label="Assigned runner">{text(task.assignedRunnerRef)}</Field>
        </div>

        <Tabs defaultValue="offers">
          <TabsList>
            <TabsTrigger value="offers">Offers{offers.length > 0 ? ` (${offers.length})` : ''}</TabsTrigger>
            <TabsTrigger value="timeline">Timeline{timeline.length > 0 ? ` (${timeline.length})` : ''}</TabsTrigger>
            <TabsTrigger value="items">Items{items.length > 0 ? ` (${items.length})` : ''}</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            {address.length > 0 && <TabsTrigger value="address">Address</TabsTrigger>}
          </TabsList>

          <TabsContent value="offers" className="pt-3">
            <OffersTable task={task} />
          </TabsContent>

          <TabsContent value="timeline" className="pt-3">
            <TimelineList task={task} />
          </TabsContent>

          <TabsContent value="items" className="pt-3">
            <LineItemsTable task={task} />
          </TabsContent>

          <TabsContent value="details" className="pt-3">
            {other.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category fields captured.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {other.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{fieldLabel(category?.fields, key)}</dt>
                    <dd className="font-medium">{text(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </TabsContent>

          {address.length > 0 && (
            <TabsContent value="address" className="flex flex-col gap-3 pt-3">
              {address.map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{fieldLabel(category?.fields, key)}</p>
                    <p className="font-medium">{text(value)}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function RunsCard({ runs, taskCodeName }: { runs: AdminRunDto[]; taskCodeName: (code: string) => string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-4" /> Courier dispatch
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {runs.length === 0 && <p className="text-sm text-muted-foreground">No courier run formed yet.</p>}
        {runs.map((run, index) => {
          const stops = run.stops ?? []
          const offers = run.offers ?? []
          return (
            <div key={run.id} className="flex flex-col gap-3">
              {index > 0 && <Separator />}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Run status">
                  <StatusBadge status={run.status} />
                </Field>
                <Field label="Assigned runner">{text(run.assignedRunnerRef)}</Field>
                <Field label="Offer attempts">{run.offerAttempts}</Field>
                <Field label="Created">{dt(run.createdAt)}</Field>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Stops</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Task status</TableHead>
                      <TableHead>Dropped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stops.map((stop) => (
                      <TableRow key={stop.serviceTaskId}>
                        <TableCell>{stop.sequence}</TableCell>
                        <TableCell className="font-medium">{taskCodeName(stop.taskCode)}</TableCell>
                        <TableCell>
                          <StatusBadge status={stop.taskStatus} />
                        </TableCell>
                        <TableCell>{stop.isDropped ? 'Yes' : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {stops.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No stops.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Runner offers</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Runner</TableHead>
                      <TableHead>Offered</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Responded</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>{offer.attemptNumber}</TableCell>
                        <TableCell className="font-medium">{text(offer.providerName)}</TableCell>
                        <TableCell className="text-muted-foreground">{dt(offer.offeredAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{dt(offer.expiresAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{dt(offer.respondedAt)}</TableCell>
                        <TableCell>
                          <StatusBadge status={offer.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {offers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Not offered to any runner yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: req, loading, error } = useAsync(() => getAdminRequestDetail(id!), [id])
  const categories = useAsync(listCategories, [])

  const categoryByCode = useMemo(() => {
    const map = new Map<string, ServiceCategoryDto>()
    for (const c of categories.data ?? []) map.set(c.code, c)
    return map
  }, [categories.data])

  const tasks = req?.tasks ?? []
  const customerId = req?.customerId ?? ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to="/orders">
            <ArrowLeft className="size-4" /> Back to orders
          </Link>
        </Button>
        {customerId && (
          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link to={`/requests/lookup?customerId=${encodeURIComponent(customerId)}`}>
              <Search className="size-4" /> Customer's requests
            </Link>
          </Button>
        )}
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {req && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold">Order {req.id.slice(0, 8)}</h1>
                {tasks.map((task) => (
                  <StatusBadge key={task.id} status={task.status} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Request ID">{req.id}</Field>
                <Field label="Agent ref">{text(req.agentRef)}</Field>
                <Field label="Customer">{text(req.customerId)}</Field>
                <Field label="Created">{dt(req.createdAt)}</Field>
                <Field label="Tasks">{tasks.length}</Field>
              </div>
            </CardContent>
          </Card>

          <BasketCard basket={req.basket} categoryByCode={categoryByCode} />

          {tasks.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">No tasks on this request.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={tasks[0].id}>
              <TabsList>
                {tasks.map((task) => (
                  <TabsTrigger key={task.id} value={task.id} className="gap-2">
                    {categoryByCode.get(task.taskCode)?.name ?? task.taskCode}
                    <StatusBadge status={task.status} />
                  </TabsTrigger>
                ))}
              </TabsList>
              {tasks.map((task) => (
                <TabsContent key={task.id} value={task.id}>
                  <TaskPanel task={task} category={categoryByCode.get(task.taskCode)} />
                </TabsContent>
              ))}
            </Tabs>
          )}

          <RunsCard
            runs={req.runs ?? []}
            taskCodeName={(code) => categoryByCode.get(code)?.name ?? code}
          />
        </>
      )}
    </div>
  )
}
