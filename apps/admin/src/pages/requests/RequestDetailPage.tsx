import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Ban, Check, MapPin, MessageCircleQuestion, PlayCircle, ShoppingCart, UserPlus, XCircle, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmActionButton } from '@/components/ConfirmActionButton'
import { TextPromptButton } from '@/components/TextPromptButton'
import { useAsync } from '@/lib/hooks/useAsync'
import { getAdminRequestDetail } from '@/lib/api/admin'
import { listCategories } from '@/lib/api/catalog'
import { assignTask, cancelTask, completeTask, confirmRequest, failTask, startTask } from '@/lib/api/requests'
import type { AdminServiceTaskDto, ServiceCategoryDto, ServiceCategoryFieldDto } from '@/types/dto'

type TimelineEntry =
  | { kind: 'status'; occurredAt: string; fromStatus: string | null | undefined; toStatus: string; reason?: string | null }
  | { kind: 'update'; occurredAt: string; updateKind: string; activityType: string; message: string }
  | { kind: 'offer'; occurredAt: string; providerName: string; stage: string; attemptNumber: number; status: string }

function buildTimeline(task: AdminServiceTaskDto): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...task.statusEvents.map(
      (e): TimelineEntry => ({ kind: 'status', occurredAt: e.occurredAt, fromStatus: e.fromStatus, toStatus: e.toStatus, reason: e.reason }),
    ),
    ...task.updates.map(
      (u): TimelineEntry => ({ kind: 'update', occurredAt: u.occurredAt, updateKind: u.kind, activityType: u.activityType, message: u.message }),
    ),
    ...task.offers.map(
      (o): TimelineEntry => ({
        kind: 'offer',
        occurredAt: o.offeredAt,
        providerName: o.providerName,
        stage: o.stage,
        attemptNumber: o.attemptNumber,
        status: o.status,
      }),
    ),
  ]
  return entries.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}

const ADDRESS_KEY_PATTERN = /address/i

function splitFieldValues(fieldValues: Record<string, string>) {
  const address: [string, string][] = []
  const other: [string, string][] = []
  for (const entry of Object.entries(fieldValues)) {
    ;(ADDRESS_KEY_PATTERN.test(entry[0]) ? address : other).push(entry)
  }
  return { address, other }
}

function fieldLabel(fields: ServiceCategoryFieldDto[] | undefined, key: string) {
  return fields?.find((f) => f.key === key)?.label ?? key
}

function TaskPanel({
  task,
  category,
  requestId,
  customerId,
  onChanged,
}: {
  task: AdminServiceTaskDto
  category: ServiceCategoryDto | undefined
  requestId: string
  customerId: string
  onChanged: () => void
}) {
  const { address, other } = splitFieldValues(task.fieldValues)
  const timeline = buildTimeline(task)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="font-medium">{category?.name ?? task.taskCode}</p>
            <StatusBadge status={task.status} />
            <Badge variant="outline">{task.stage} stage</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <TextPromptButton
              label="Assign"
              title="Assign runner"
              fieldLabel="Runner ref"
              icon={<UserPlus className="size-4" />}
              onSubmit={async (runnerRef) => {
                await assignTask({ taskId: task.id, serviceRequestId: requestId, assignedRunnerRef: runnerRef }, customerId)
                onChanged()
              }}
            />
            <ConfirmActionButton
              label="Start"
              title="Start task"
              description={`Mark "${task.taskCode}" as started.`}
              icon={<PlayCircle className="size-4" />}
              onConfirm={async () => {
                await startTask({ taskId: task.id, serviceRequestId: requestId }, customerId)
                onChanged()
              }}
            />
            <ConfirmActionButton
              label="Complete"
              title="Complete task"
              description={`Mark "${task.taskCode}" as completed.`}
              icon={<Check className="size-4" />}
              onConfirm={async () => {
                await completeTask({ taskId: task.id, serviceRequestId: requestId }, customerId)
                onChanged()
              }}
            />
            <TextPromptButton
              label="Cancel"
              title="Cancel task"
              fieldLabel="Reason"
              icon={<Ban className="size-4" />}
              variant="destructive"
              onSubmit={async (reason) => {
                await cancelTask({ taskId: task.id, serviceRequestId: requestId, reason }, customerId)
                onChanged()
              }}
            />
            <TextPromptButton
              label="Fail"
              title="Mark task failed"
              fieldLabel="Reason"
              icon={<XCircle className="size-4" />}
              variant="destructive"
              onSubmit={async (reason) => {
                await failTask({ taskId: task.id, serviceRequestId: requestId, reason }, customerId)
                onChanged()
              }}
            />
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Task details</TabsTrigger>
            {address.length > 0 && <TabsTrigger value="address">Address</TabsTrigger>}
            <TabsTrigger value="items">Items{task.lineItems.length > 0 ? ` (${task.lineItems.length})` : ''}</TabsTrigger>
            <TabsTrigger value="events">Events{timeline.length > 0 ? ` (${timeline.length})` : ''}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex flex-col gap-4 pt-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Zone</p>
                <p className="font-medium">{task.zoneName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price / ETA</p>
                <p className="font-medium">
                  {task.estimatedPrice} / {task.estimatedEtaMinutes} min
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned vendor</p>
                <p className="font-medium">{task.assignedVendorRef ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned runner</p>
                <p className="font-medium">{task.assignedRunnerRef ?? '—'}</p>
              </div>
            </div>

            {other.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Category fields</p>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {other.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{fieldLabel(category?.fields, key)}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </TabsContent>

          {address.length > 0 && (
            <TabsContent value="address" className="flex flex-col gap-3 pt-3">
              {address.map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{fieldLabel(category?.fields, key)}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          )}

          <TabsContent value="items" className="pt-3">
            {task.lineItems.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="size-4" /> No cart items on this task.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Pack size</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {task.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.displayName}</TableCell>
                      <TableCell>{item.brand ?? '—'}</TableCell>
                      <TableCell>{item.packSize ?? '—'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unitPriceSnapshot.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="events" className="pt-3">
            {timeline.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
            <ul className="flex flex-col gap-2">
              {timeline.map((entry, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm">
                  {entry.kind === 'status' && (
                    <span className="flex items-center gap-1.5">
                      <Badge variant="secondary">Status</Badge>
                      {entry.fromStatus ?? 'created'} → <span className="font-medium">{entry.toStatus}</span>
                      {entry.reason && <span className="text-muted-foreground">({entry.reason})</span>}
                    </span>
                  )}
                  {entry.kind === 'update' && (
                    <span className="flex items-center gap-1.5">
                      <Badge variant={entry.updateKind === 'Question' ? 'destructive' : 'outline'}>
                        {entry.updateKind === 'Question' ? <MessageCircleQuestion className="size-3" /> : null}
                        {entry.activityType}
                      </Badge>
                      {entry.message}
                    </span>
                  )}
                  {entry.kind === 'offer' && (
                    <span className="flex items-center gap-1.5">
                      <Badge variant="secondary">Offer</Badge>
                      #{entry.attemptNumber} to <span className="font-medium">{entry.providerName}</span> ({entry.stage})
                      <StatusBadge status={entry.status} />
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: req, loading, error, refetch } = useAsync(() => getAdminRequestDetail(id!), [id])
  const categories = useAsync(listCategories, [])
  const customerId = req?.customerId ?? ''

  const categoryByCode = useMemo(() => {
    const map = new Map<string, ServiceCategoryDto>()
    for (const c of categories.data ?? []) map.set(c.code, c)
    return map
  }, [categories.data])

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={customerId ? `/requests/lookup?customerId=${encodeURIComponent(customerId)}` : '/requests/lookup'}>
          <ArrowLeft className="size-4" /> Back to lookup
        </Link>
      </Button>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {req && (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold">Order</h1>
                <p className="text-sm text-muted-foreground">
                  Customer {req.customerId} · {req.tasks.length} task{req.tasks.length === 1 ? '' : 's'} · created{' '}
                  {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>
              <ConfirmActionButton
                label="Confirm request"
                title="Confirm all tasks"
                description="Confirms every draft task on this request."
                icon={<Check className="size-4" />}
                onConfirm={async () => {
                  await confirmRequest({ serviceRequestId: req.id }, customerId)
                  refetch()
                }}
              />
            </CardContent>
          </Card>

          {req.tasks.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">No tasks on this request.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={req.tasks[0].id}>
              <TabsList>
                {req.tasks.map((task) => (
                  <TabsTrigger key={task.id} value={task.id} className="gap-2">
                    {categoryByCode.get(task.taskCode)?.name ?? task.taskCode}
                    <StatusBadge status={task.status} />
                  </TabsTrigger>
                ))}
              </TabsList>
              {req.tasks.map((task) => (
                <TabsContent key={task.id} value={task.id}>
                  <TaskPanel
                    task={task}
                    category={categoryByCode.get(task.taskCode)}
                    requestId={req.id}
                    customerId={customerId}
                    onChanged={refetch}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
