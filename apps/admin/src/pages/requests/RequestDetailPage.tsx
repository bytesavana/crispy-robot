import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Ban, Check, PlayCircle, UserPlus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmActionButton } from '@/components/ConfirmActionButton'
import { TextPromptButton } from '@/components/TextPromptButton'
import { useAsync } from '@/lib/hooks/useAsync'
import {
  assignTask,
  cancelTask,
  completeTask,
  confirmRequest,
  failTask,
  startTask,
} from '@/lib/api/requests'
import { getRequest } from '@/lib/api/requests'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customerId') ?? ''

  const { data: req, loading, error, refetch } = useAsync(() => getRequest(id!, customerId), [id, customerId])

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={`/requests/lookup?customerId=${encodeURIComponent(customerId)}`}>
          <ArrowLeft className="size-4" /> Back to lookup
        </Link>
      </Button>

      {!customerId && <ErrorAlert message="No customer id in the URL — open this page via the request lookup flow." />}
      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {req && (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold">{req.agentRef}</h1>
                <p className="text-sm text-muted-foreground">
                  Customer {req.customerId} · created {new Date(req.createdAt).toLocaleString()}
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

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Runner</TableHead>
                    <TableHead>Price / ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {req.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.taskCode}</TableCell>
                      <TableCell>{task.zoneName}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>{task.assignedRunnerRef ?? '—'}</TableCell>
                      <TableCell>
                        {task.estimatedPrice} / {task.estimatedEtaMinutes} min
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <TextPromptButton
                            label="Assign"
                            title="Assign runner"
                            fieldLabel="Runner ref"
                            icon={<UserPlus className="size-4" />}
                            onSubmit={async (runnerRef) => {
                              await assignTask(
                                { taskId: task.id, serviceRequestId: req.id, assignedRunnerRef: runnerRef },
                                customerId,
                              )
                              refetch()
                            }}
                          />
                          <ConfirmActionButton
                            label="Start"
                            title="Start task"
                            description={`Mark "${task.taskCode}" as started.`}
                            icon={<PlayCircle className="size-4" />}
                            onConfirm={async () => {
                              await startTask({ taskId: task.id, serviceRequestId: req.id }, customerId)
                              refetch()
                            }}
                          />
                          <ConfirmActionButton
                            label="Complete"
                            title="Complete task"
                            description={`Mark "${task.taskCode}" as completed.`}
                            icon={<Check className="size-4" />}
                            onConfirm={async () => {
                              await completeTask({ taskId: task.id, serviceRequestId: req.id }, customerId)
                              refetch()
                            }}
                          />
                          <TextPromptButton
                            label="Cancel"
                            title="Cancel task"
                            fieldLabel="Reason"
                            icon={<Ban className="size-4" />}
                            variant="destructive"
                            onSubmit={async (reason) => {
                              await cancelTask({ taskId: task.id, serviceRequestId: req.id, reason }, customerId)
                              refetch()
                            }}
                          />
                          <TextPromptButton
                            label="Fail"
                            title="Mark task failed"
                            fieldLabel="Reason"
                            icon={<XCircle className="size-4" />}
                            variant="destructive"
                            onSubmit={async (reason) => {
                              await failTask({ taskId: task.id, serviceRequestId: req.id, reason }, customerId)
                              refetch()
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
